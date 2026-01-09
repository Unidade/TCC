import React, { useState, useEffect, useRef } from "react";
import { useGraph } from "@react-three/fiber";
import { useGLTF, useAnimations, useFBX } from "@react-three/drei";
import { SkeletonUtils } from "three-stdlib";
import { CORRESPONDING_VISEME } from "@/lib/viseme";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

// Type for SkinnedMesh with morph targets
type SkinnedMeshWithMorphTargets = THREE.SkinnedMesh & {
  morphTargetDictionary?: { [key: string]: number };
  morphTargetInfluences?: number[];
};

// Type for the avatar nodes
interface AvatarNodes {
  Hips: THREE.Object3D;
  Wolf3D_Hair: THREE.SkinnedMesh;
  Wolf3D_Glasses: THREE.SkinnedMesh;
  Wolf3D_Body: THREE.SkinnedMesh;
  Wolf3D_Outfit_Bottom: THREE.SkinnedMesh;
  Wolf3D_Outfit_Footwear: THREE.SkinnedMesh;
  Wolf3D_Outfit_Top: THREE.SkinnedMesh;
  EyeLeft: SkinnedMeshWithMorphTargets;
  EyeRight: SkinnedMeshWithMorphTargets;
  Wolf3D_Head: SkinnedMeshWithMorphTargets;
  Wolf3D_Teeth: SkinnedMeshWithMorphTargets;
  [key: string]: THREE.Object3D;
}

interface AvatarProps {
  text?: string;
  audioUrl?: string;
  duration?: number;
  onAudioEnd?: () => void;
  position?: [number, number, number];
  scale?: number;
}

export function Avatar({
  text = "",
  audioUrl,
  duration,
  onAudioEnd,
  position = [0, -5, 5],
  scale = 3,
}: AvatarProps) {
  const { scene } = useGLTF("/models/674d75af3c0313725248ed0d.glb");
  const clone = React.useMemo(() => SkeletonUtils.clone(scene), [scene]);
  const { nodes: rawNodes, materials } = useGraph(clone);
  const nodes = rawNodes as unknown as AvatarNodes;

  const { animations: idleAnimation } = useFBX("/animations/Idle.fbx");
  idleAnimation[0].name = "Idle";

  const [animation] = useState("Idle");
  const group = useRef<THREE.Group>(null);
  const { actions } = useAnimations([idleAnimation[0]], group);
  const currentViseme = useRef<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const visemeIntervalRef = useRef<number | null>(null);
  const morphTargetSmoothing = 0.3;

  useEffect(() => {
    if (actions[animation]) {
      actions[animation]?.reset().fadeIn(0.5).play();
      return () => {
        actions[animation]?.fadeOut(0.5);
      };
    }
  }, [animation, actions]);

  useEffect(() => {
    if (audioUrl && text && duration) {
      // Clean up previous audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (visemeIntervalRef.current) {
        clearInterval(visemeIntervalRef.current);
        visemeIntervalRef.current = null;
      }

      // Create audio element
      const audio = new Audio(`data:audio/wav;base64,${audioUrl}`);
      audioRef.current = audio;

      // Calculate timing per character
      const characters = text.toUpperCase().split("");
      const timePerChar = duration / characters.length;

      // Start viseme animation
      let charIndex = 0;
      visemeIntervalRef.current = window.setInterval(() => {
        if (charIndex < characters.length) {
          const char = characters[charIndex];
          const viseme = CORRESPONDING_VISEME[char];
          if (viseme) {
            currentViseme.current = viseme;
            setTimeout(() => {
              if (currentViseme.current === viseme) {
                currentViseme.current = null;
              }
            }, timePerChar * 1000 * 0.5);
          }
          charIndex++;
        }
      }, timePerChar * 1000);

      // Handle audio end
      audio.onended = () => {
        if (visemeIntervalRef.current) {
          clearInterval(visemeIntervalRef.current);
          visemeIntervalRef.current = null;
        }
        currentViseme.current = null;

        // Reset morph targets
        setTimeout(() => {
          const headDict = nodes.Wolf3D_Head?.morphTargetDictionary;
          if (headDict) {
            Object.keys(headDict).forEach((key) => {
              const index = headDict[key];
              if (nodes.Wolf3D_Head?.morphTargetInfluences) {
                nodes.Wolf3D_Head.morphTargetInfluences[index] = 0;
              }
              if (nodes.Wolf3D_Teeth?.morphTargetInfluences) {
                nodes.Wolf3D_Teeth.morphTargetInfluences[index] = 0;
              }
            });
          }
        }, 300);

        onAudioEnd?.();
      };

      // Play audio
      audio.play().catch((err) => {
        console.error("Error playing audio:", err);
      });
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (visemeIntervalRef.current) {
        clearInterval(visemeIntervalRef.current);
        visemeIntervalRef.current = null;
      }
    };
  }, [audioUrl, text, duration, onAudioEnd, nodes]);

  useFrame(() => {
    if (!nodes.Wolf3D_Head || !nodes.Wolf3D_Head.morphTargetDictionary) return;

    if (currentViseme.current) {
      const index = nodes.Wolf3D_Head.morphTargetDictionary[currentViseme.current];
      if (index !== undefined && nodes.Wolf3D_Head.morphTargetInfluences) {
        nodes.Wolf3D_Head.morphTargetInfluences[index] = THREE.MathUtils.lerp(
          nodes.Wolf3D_Head.morphTargetInfluences[index],
          1,
          morphTargetSmoothing
        );

        if (nodes.Wolf3D_Teeth && nodes.Wolf3D_Teeth.morphTargetInfluences) {
          nodes.Wolf3D_Teeth.morphTargetInfluences[index] = THREE.MathUtils.lerp(
            nodes.Wolf3D_Teeth.morphTargetInfluences[index],
            1,
            morphTargetSmoothing
          );
        }
      }
    } else {
      const headDict = nodes.Wolf3D_Head?.morphTargetDictionary;
      if (headDict) {
        Object.keys(headDict).forEach((key) => {
          const index = headDict[key];
          if (nodes.Wolf3D_Head?.morphTargetInfluences) {
            nodes.Wolf3D_Head.morphTargetInfluences[index] = THREE.MathUtils.lerp(
              nodes.Wolf3D_Head.morphTargetInfluences[index],
              0,
              0.15
            );
          }
          if (nodes.Wolf3D_Teeth?.morphTargetInfluences) {
            nodes.Wolf3D_Teeth.morphTargetInfluences[index] = THREE.MathUtils.lerp(
              nodes.Wolf3D_Teeth.morphTargetInfluences[index],
              0,
              0.15
            );
          }
        });
      }
    }
  });

  return (
    <group position={position} scale={scale} dispose={null} ref={group}>
      <primitive object={nodes.Hips} />
      <skinnedMesh
        geometry={nodes.Wolf3D_Hair.geometry}
        material={materials.Wolf3D_Hair}
        skeleton={nodes.Wolf3D_Hair.skeleton}
      />
      <skinnedMesh
        geometry={nodes.Wolf3D_Glasses.geometry}
        material={materials.Wolf3D_Glasses}
        skeleton={nodes.Wolf3D_Glasses.skeleton}
      />
      <skinnedMesh
        geometry={nodes.Wolf3D_Body.geometry}
        material={materials.Wolf3D_Body}
        skeleton={nodes.Wolf3D_Body.skeleton}
      />
      <skinnedMesh
        geometry={nodes.Wolf3D_Outfit_Bottom.geometry}
        material={materials.Wolf3D_Outfit_Bottom}
        skeleton={nodes.Wolf3D_Outfit_Bottom.skeleton}
      />
      <skinnedMesh
        geometry={nodes.Wolf3D_Outfit_Footwear.geometry}
        material={materials.Wolf3D_Outfit_Footwear}
        skeleton={nodes.Wolf3D_Outfit_Footwear.skeleton}
      />
      <skinnedMesh
        geometry={nodes.Wolf3D_Outfit_Top.geometry}
        material={materials.Wolf3D_Outfit_Top}
        skeleton={nodes.Wolf3D_Outfit_Top.skeleton}
      />
      <skinnedMesh
        name="EyeLeft"
        geometry={nodes.EyeLeft.geometry}
        material={materials.Wolf3D_Eye}
        skeleton={nodes.EyeLeft.skeleton}
        morphTargetDictionary={nodes.EyeLeft.morphTargetDictionary}
        morphTargetInfluences={nodes.EyeLeft.morphTargetInfluences}
      />
      <skinnedMesh
        name="EyeRight"
        geometry={nodes.EyeRight.geometry}
        material={materials.Wolf3D_Eye}
        skeleton={nodes.EyeRight.skeleton}
        morphTargetDictionary={nodes.EyeRight.morphTargetDictionary}
        morphTargetInfluences={nodes.EyeRight.morphTargetInfluences}
      />
      <skinnedMesh
        name="Wolf3D_Head"
        geometry={nodes.Wolf3D_Head.geometry}
        material={materials.Wolf3D_Skin}
        skeleton={nodes.Wolf3D_Head.skeleton}
        morphTargetDictionary={nodes.Wolf3D_Head.morphTargetDictionary}
        morphTargetInfluences={nodes.Wolf3D_Head.morphTargetInfluences}
      />
      <skinnedMesh
        name="Wolf3D_Teeth"
        geometry={nodes.Wolf3D_Teeth.geometry}
        material={materials.Wolf3D_Teeth}
        skeleton={nodes.Wolf3D_Teeth.skeleton}
        morphTargetDictionary={nodes.Wolf3D_Teeth.morphTargetDictionary}
        morphTargetInfluences={nodes.Wolf3D_Teeth.morphTargetInfluences}
      />
    </group>
  );
}

// Preload the model
useGLTF.preload("/models/674d75af3c0313725248ed0d.glb");
