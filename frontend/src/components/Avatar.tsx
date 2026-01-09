import React, { useState, useEffect, useRef } from "react";
import { useGraph, useFrame } from "@react-three/fiber";
import { useGLTF, useAnimations, useFBX } from "@react-three/drei";
import { SkeletonUtils } from "three-stdlib";
import { CORRESPONDING_VISEME } from "@/lib/viseme";
import * as THREE from "three";

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
  ...props
}: AvatarProps) {
  const { scene } = useGLTF("/models/674d75af3c0313725248ed0d.glb");
  const clone = React.useMemo(() => SkeletonUtils.clone(scene), [scene]);
  const { nodes, materials } = useGraph(clone) as { nodes: any; materials: any };

  const { animations: idleAnimation } = useFBX("/animations/Idle.fbx");

  // Set animation name
  if (idleAnimation[0]) {
    idleAnimation[0].name = "Idle";
  }

  const [animation] = useState("Idle");
  const group = useRef<THREE.Group>(null);
  const { actions } = useAnimations([idleAnimation[0]], group);
  const currentViseme = useRef<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const visemeIntervalRef = useRef<number | null>(null);
  const morphTargetSmoothing = 0.3;

  // Store onAudioEnd in a ref to avoid re-triggering effects when it changes
  const onAudioEndRef = useRef(onAudioEnd);
  onAudioEndRef.current = onAudioEnd;

  useEffect(() => {
    actions[animation] && actions[animation]?.reset().fadeIn(0.5).play();
    return () => {
      actions[animation] && actions[animation]?.fadeOut(0.5);
    };
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
          Object.keys(nodes.Wolf3D_Head.morphTargetDictionary).forEach(
            (key) => {
              const index = nodes.Wolf3D_Head.morphTargetDictionary[key];
              nodes.Wolf3D_Head.morphTargetInfluences[index] = 0;
              nodes.Wolf3D_Teeth.morphTargetInfluences[index] = 0;
            }
          );
        }, 300);

        onAudioEndRef.current?.();
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
  }, [audioUrl, text, duration, nodes]);

  useFrame(() => {
    if (currentViseme.current) {
      const index =
        nodes.Wolf3D_Head.morphTargetDictionary[currentViseme.current];

      nodes.Wolf3D_Head.morphTargetInfluences[index] = THREE.MathUtils.lerp(
        nodes.Wolf3D_Head.morphTargetInfluences[index],
        1,
        morphTargetSmoothing
      );

      nodes.Wolf3D_Teeth.morphTargetInfluences[index] = THREE.MathUtils.lerp(
        nodes.Wolf3D_Teeth.morphTargetInfluences[index],
        1,
        morphTargetSmoothing
      );
    } else {
      Object.keys(nodes.Wolf3D_Head.morphTargetDictionary).forEach((key) => {
        const index = nodes.Wolf3D_Head.morphTargetDictionary[key];

        nodes.Wolf3D_Head.morphTargetInfluences[index] = THREE.MathUtils.lerp(
          nodes.Wolf3D_Head.morphTargetInfluences[index],
          0,
          0.15
        );

        nodes.Wolf3D_Teeth.morphTargetInfluences[index] = THREE.MathUtils.lerp(
          nodes.Wolf3D_Teeth.morphTargetInfluences[index],
          0,
          0.15
        );
      });
    }
  });

  return (
    <group {...props} position={position} scale={scale} dispose={null} ref={group}>
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

useGLTF.preload("/models/674d75af3c0313725248ed0d.glb");
