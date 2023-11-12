import { setAttributes, setStyles, createSvgElement } from "./util.mjs";

function calculateBar({ size }) {
  return {
    x: size.width / 2,
    y: 0,
    width: 0.5,
    height: size.height,
    fill: "#aaa",
  };
}

function calculateNote({
  size,
  note,
  elapsedSec,
  minNote,
  maxNote,
  timeRangeSec,
  minHue,
  maxHue,
  baseLightness,
  peakLightness,
  activeLightness,
  baseThickness,
  peakThickness,
  activeThickness,
  decaySec,
  releaseSec,
}) {
  const fullHeightPerNote = size.height / (maxNote - minNote);
  const widthPerSec = size.width / timeRangeSec;
  const hue =
    ((note.noteNumber - minNote) / (maxNote - minNote)) * (maxHue - minHue) +
    minHue;
  const lightness = calcEnvelope({
    base: baseLightness,
    peak: peakLightness,
    active: activeLightness,
    decaySec,
    releaseSec,
    fromSec: note.fromSec,
    toSec: note.toSec,
    elapsedSec,
  });
  const thickness = calcEnvelope({
    base: baseThickness,
    peak: peakThickness,
    active: activeThickness,
    decaySec,
    releaseSec,
    fromSec: note.fromSec,
    toSec: note.toSec,
    elapsedSec,
  });
  const x = (note.fromSec - elapsedSec + timeRangeSec / 2) * widthPerSec;
  const y =
    size.height -
    (note.noteNumber - minNote - 0.5 + thickness / 2) * fullHeightPerNote;
  const width = (note.toSec - note.fromSec) * widthPerSec;
  const height = fullHeightPerNote * thickness;
  return {
    x,
    y,
    width,
    height,
    fill: `hsl(${hue}, 20%, ${lightness}%)`,
  };
}

function calcEnvelope({
  base,
  peak,
  active,
  decaySec,
  releaseSec,
  fromSec,
  toSec,
  elapsedSec,
}) {
  return elapsedSec < fromSec
    ? base
    : elapsedSec < toSec
    ? active + (peak - active) * Math.exp(-(elapsedSec - fromSec) / decaySec)
    : base + (active - base) * Math.exp(-(elapsedSec - toSec) / releaseSec);
}

export const config = {
  props: [
    {
      id: "minNote",
      name: "Min Note",
      type: "number",
      min: 0,
      max: 127,
      step: 1,
      defaultValue: 0,
    },
    {
      id: "maxNote",
      name: "Max Note",
      type: "number",
      min: 0,
      max: 127,
      step: 1,
      defaultValue: 127,
    },
    {
      id: "timeRangeSec",
      name: "Time Range (sec)",
      type: "number",
      min: 1,
      max: 20,
      step: 1,
      defaultValue: 10,
    },
    {
      id: "minHue",
      name: "Min Hue",
      type: "number",
      min: -360,
      max: 360,
      step: 5,
      defaultValue: 0,
    },
    {
      id: "maxHue",
      name: "Max Hue",
      type: "number",
      min: -360,
      max: 360,
      step: 5,
      defaultValue: 240,
    },
    {
      id: "baseLightness",
      name: "Base Lightness",
      type: "number",
      min: 0,
      max: 100,
      step: 5,
      defaultValue: 30,
    },
    {
      id: "peakLightness",
      name: "Peak Lightness",
      type: "number",
      min: 0,
      max: 100,
      step: 5,
      defaultValue: 100,
    },
    {
      id: "activeLightness",
      name: "Active Lightness",
      type: "number",
      min: 0,
      max: 100,
      step: 5,
      defaultValue: 80,
    },
    {
      id: "baseThickness",
      name: "Base Thickness",
      type: "number",
      min: 0,
      max: 1,
      step: 0.05,
      defaultValue: 0.4,
    },
    {
      id: "peakThickness",
      name: "Peak Thickness",
      type: "number",
      min: 0,
      max: 1,
      step: 0.05,
      defaultValue: 1,
    },
    {
      id: "activeThickness",
      name: "Active Thickness",
      type: "number",
      min: 0,
      max: 1,
      step: 0.05,
      defaultValue: 0.6,
    },
    {
      id: "vertical",
      name: "Vertical",
      type: "number",
      min: 0,
      max: 1,
      step: 1,
      defaultValue: 0,
    },
  ],
};

export function init(svg, { size, notes }) {
  const bar = createSvgElement("rect");
  setAttributes(bar, {
    id: "bar",
  });
  svg.appendChild(bar);
  for (const _note of notes) {
    const rect = createSvgElement("rect");
    setAttributes(rect, {
      class: "note",
    });
    svg.appendChild(rect);
  }
}

export function update(
  svg,
  { notes, size, enabledTracks, elapsedSec, customProps, playing },
) {
  const {
    minNote,
    maxNote,
    minHue,
    maxHue,
    timeRangeSec,
    baseLightness,
    peakLightness,
    activeLightness,
    baseThickness,
    peakThickness,
    activeThickness,
    vertical,
  } = customProps;
  const bar = svg.getElementById("bar");
  const barPatch = calculateBar({ size: vertical ? flipSize(size) : size });
  setAttributes(bar, vertical ? flipRect(barPatch, size) : barPatch);

  const rects = svg.querySelectorAll(".note");
  for (const [index, note] of notes.entries()) {
    const rect = rects[index];
    if (
      playing &&
      (vertical
        ? rect.getAttribute("y") > size.height
        : rect.getAttribute("x") + rect.getAttribute("width") < 0)
    ) {
      continue;
    }
    const patch = calculateNote({
      size: vertical ? flipSize(size) : size,
      note,
      elapsedSec,
      minNote,
      maxNote,
      timeRangeSec,
      minHue,
      maxHue,
      baseLightness,
      peakLightness,
      activeLightness,
      baseThickness,
      peakThickness,
      activeThickness,
      decaySec: 0.2,
      releaseSec: 0.4,
    });
    if (playing && patch.x > size.width) {
      continue;
    }
    const stylePatch = {
      display: !enabledTracks[note.trackIndex] ? "none" : "block",
    };
    setStyles(rect, stylePatch);
    setAttributes(rect, vertical ? flipRect(patch, size) : patch);
  }
}
function flipSize({ width, height }) {
  return {
    width: height,
    height: width,
  };
}
function flipRect(
  { x, y, width, height, ...rest },
  { width: sizeWidth, height: sizeHeight },
) {
  return {
    ...rest,
    x: sizeWidth - y - height,
    y: sizeHeight - x - width,
    width: height,
    height: width,
  };
}
