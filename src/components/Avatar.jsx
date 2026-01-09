import React, { useState, useEffect, useRef } from "react";
import { useGraph } from "@react-three/fiber";
import { useGLTF, useAnimations, useFBX } from "@react-three/drei";
import { SkeletonUtils } from "three-stdlib";
import { CORRESPONDING_VISEME } from "../constant";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useControls } from "leva";

export function Avatar(props) {
  const { scene } = useGLTF("/models/674d75af3c0313725248ed0d.glb");
  const clone = React.useMemo(() => SkeletonUtils.clone(scene), [scene]);
  const { nodes, materials } = useGraph(clone);

  const { animations: idleAnimation } = useFBX("/animations/Idle.fbx");

  idleAnimation[0].name = "Idle";

  const [animation] = useState("Idle");
  const group = useRef();
  const { actions } = useAnimations([idleAnimation[0]], group);
  const currentViseme = useRef(null);

  const { morphTargetSmoothing } = useControls(
    {
      headFollow: true,
      smoothMorphTarget: true,
      morphTargetSmoothing: { value: 0.3, min: 0, max: 1, step: 0.01 },
    },
    { hidden: true }
  );

  useEffect(() => {
    actions[animation] && actions[animation].reset().fadeIn(0.5).play();
    return () => actions[animation] && actions[animation].fadeOut(0.5);
  }, [animation]);

  useEffect(() => {
    if (props?.speak) {
      const utterance = new SpeechSynthesisUtterance(props.text);
      const words = props.text.toUpperCase().split("");

      utterance.onboundary = (event) => {
        const word = words[event.charIndex];

        if (!word) return;

        const phoneme = word.toUpperCase();
        const viseme = CORRESPONDING_VISEME[phoneme];

        if (viseme) {
          currentViseme.current = viseme;

          setTimeout(() => {
            if (currentViseme.current === viseme) {
              currentViseme.current = null;
            }
          }, 150);
        }
      };

      utterance.onend = () => {
        console.log("Speech ended, resetting viseme");

        setTimeout(() => {
          currentViseme.current = null;

          Object.keys(nodes.Wolf3D_Head.morphTargetDictionary).forEach(
            (key) => {
              const index = nodes.Wolf3D_Head.morphTargetDictionary[key];
              nodes.Wolf3D_Head.morphTargetInfluences[index] = 0;
              nodes.Wolf3D_Teeth.morphTargetInfluences[index] = 0;
            }
          );
        }, 300);
      };

      speechSynthesis.speak(utterance);
      props.setSpeak(false);
    }
  }, [props?.speak]);

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
          0.15 // Lower value = smoother transition to idle
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
    <group {...props} dispose={null} ref={group}>
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
