import { Environment, useTexture } from "@react-three/drei";
import { Avatar } from "./Avatar";
import { useThree } from "@react-three/fiber";
import { TEXTURE_PATH } from "@/lib/viseme";

interface ExperienceProps {
  text?: string;
  audioUrl?: string;
  duration?: number;
  onAudioEnd?: () => void;
}

export function Experience({
  text,
  audioUrl,
  duration,
  onAudioEnd,
}: ExperienceProps) {
  const texture = useTexture(TEXTURE_PATH);
  const viewport = useThree((state) => state.viewport);

  return (
    <>
      <Avatar
        position={[0, -5, 5]}
        scale={3}
        text={text}
        audioUrl={audioUrl}
        duration={duration}
        onAudioEnd={onAudioEnd}
      />
      <Environment preset="sunset" />
      <mesh>
        <planeGeometry args={[viewport.width, viewport.height]} />
        <meshBasicMaterial map={texture} />
      </mesh>
    </>
  );
}
