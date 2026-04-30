import { routeOptions } from '../data/config';
import { useGameFlowStore } from '../store/gameFlowStore';

interface MenuSceneProps {
  onNotice: (message: string) => void;
}

export function MenuScene({ onNotice }: MenuSceneProps) {
  const setScene = useGameFlowStore((state) => state.setScene);
  const setRoute = useGameFlowStore((state) => state.setRoute);

  return (
    <section className="gal-scene gal-scene--menu" style={{ backgroundImage: "url('/assets/ui/main-menu.png')" }}>
      <div className="gal-overlay gal-overlay--soft" />
      <div className="gal-menu-card">
        <h1>凤华录</h1>
        <p>借用参考图布局，主菜单文本已按项目架构替换为四线开局入口。</p>
        <div className="gal-menu-routes">
          {routeOptions.map((route) => (
            <button
              key={route.id}
              type="button"
              disabled={!route.enabled}
              className={!route.enabled ? 'is-disabled' : ''}
              onClick={() => {
                if (!route.enabled) {
                  onNotice('该路线暂未开放。');
                  return;
                }
                setRoute(route.id as never);
                setScene('attribute');
                onNotice(`已进入 ${route.label} 的开局配置。`);
              }}
            >
              {route.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
