interface SceneBackProps {
  sceneName: string;
}

export function SceneBack({ sceneName }: SceneBackProps) {
  return (
    <div className="scene-back">
      <div className="scene-back__overlay" />
      <span className="scene-back__title">{sceneName}</span>
    </div>
  );
}
