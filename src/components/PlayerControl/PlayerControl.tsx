import { ReactNode } from "react";
import * as styles from "./PlayerControl.css.ts";
import { formatTime } from "../../util";
import { useAtomValue } from "jotai";
import { currentTimeInSecAtom } from "@/atoms";

type Props = {
  onPlay: () => void;
  onPause: () => void;
  onReturn: () => void;
  isPlaying: boolean;
  startTime: number | null;
  seekBar: ReactNode;
};

export const PlayerControl = ({
  isPlaying,
  onPlay,
  onPause,
  onReturn,
  seekBar,
}: Props) => {
  const currentTimeInSec = useAtomValue(currentTimeInSecAtom);
  return (
    <div>
      {seekBar}
      <div className={styles.controls}>
        <div>
          <button onClick={onReturn}>Return</button>
          {isPlaying ? (
            <button onClick={onPause}>Pause</button>
          ) : (
            <button onClick={onPlay}>Play</button>
          )}
        </div>
        <div>
          {currentTimeInSec == null ? "--:--" : formatTime(currentTimeInSec)}
        </div>
      </div>
    </div>
  );
};
