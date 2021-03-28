namespace gdjs {
  export namespace evtTools {
    /**
     * The namespace containing tools to interact with the debugger.
     * @namespace
     */
    export namespace debuggerTools {
      /**
       * Stop the game execution.
       * @param runtimeScene - The current scene.
       */
      export const pause = function (runtimeScene: gdjs.RuntimeScene) {
        runtimeScene.getGame().pause(true);
      };

      /**
       * Draw collisions hitboxes and points
       * @param runtimeScene - The current scene.
       */
      export const enableDebugDraw = function (
        runtimeScene: gdjs.RuntimeScene,
        enableDebugDrawRenderedObjects: boolean,
        showHiddenInstances: boolean,
        showPointsNames: boolean,
        showCustomPoints: boolean
      ) {
        runtimeScene.renderDebugDraw(
          enableDebugDrawRenderedObjects,
          showHiddenInstances,
          showPointsNames,
          showCustomPoints
        );
      };
    }
  }
}
