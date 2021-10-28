namespace gdjs {
  const logger = new gdjs.Logger('Debugger client');

  const originalConsole = {
    log: console.log,
    info: console.info,
    debug: console.debug,
    warn: console.warn,
    error: console.error,
  };

  /**
   * An client side implementation of the Debugger
   */
  export interface IDebuggerClient {
    /**
     * Logs a value in the debugger console.
     * @param message - The value to log inside the console.
     * @param additionalData - Additional data about the log.
     */
    log(
      group: string,
      message: string,
      type: 'info' | 'warning' | 'error',
      internal: boolean
    ): void;

    /**
     * Update a value, specified by a path starting from the {@link RuntimeGame} instance.
     * @param path - The path to the variable, starting from {@link RuntimeGame}.
     * @param newValue - The new value.
     * @return Was the operation successful?
     */
    set(path: string[], newValue: any): boolean;

    /**
     * Call a method, specified by a path starting from the {@link RuntimeGame} instance.
     * @param path - The path to the method, starting from {@link RuntimeGame}.
     * @param args - The arguments to pass the method.
     * @return Was the operation successful?
     */
    call(path: string[], args: any[]): boolean;

    /**
     * Dump all the relevant data from the {@link RuntimeGame} instance and send it to the server.
     */
    sendRuntimeGameDump(): void;

    /**
     * Send logs from the hot reloader to the server.
     * @param logs The hot reloader logs.
     */
    sendHotReloaderLogs(logs: HotReloaderLog[]): void;

    /**
     * Callback called when profiling is starting.
     */
    sendProfilerStarted(): void;

    /**
     * Callback called when profiling is ending.
     */
    sendProfilerStopped(): void;

    /**
     * Send profiling results.
     * @param framesAverageMeasures The measures made for each frames.
     * @param stats Other measures done during the profiler run.
     */
    sendProfilerOutput(
      framesAverageMeasures: FrameMeasure,
      stats: ProfilerStats
    ): void;
  }

  /**
   * A function used to replace circular references with a new value.
   * @param key - The key corresponding to the value.
   * @param value - The value.
   * @returns The new value.
   */
  type DebuggerClientCycleReplacer = (key: string, value: any) => any;

  /**
   * This {@link IDebuggerClient} connects to a websocket server, can dump
   * the data of the current game, and receive message to change a field or
   * call a function, specified by a path from the {@link RuntimeGame}.
   *
   * @param runtimeGame - The `gdjs.RuntimeGame` to be debugged
   */
  export class WindowMessageDebuggerClient implements IDebuggerClient {
    _runtimegame: gdjs.RuntimeGame;
    _hotReloader: gdjs.HotReloader;
    _opener: Window | null = null;

    /**
     * @param path - The path of the property to modify, starting from the RuntimeGame.
     */
    constructor(runtimeGame: RuntimeGame) {
      this._runtimegame = runtimeGame;
      this._hotReloader = new gdjs.HotReloader(runtimeGame);

      this._opener = window.opener || null;

      if (!this._opener) {
        logger.log("window.opener not existing, Debugger won't work");
        return;
      }

      const that = this;
      window.addEventListener('message', (event) => {
        const data = event.data;
        console.log('received', data);

        if (data && data.command) {
          if (data.command === 'play') {
            runtimeGame.pause(false);
          } else if (data.command === 'pause') {
            runtimeGame.pause(true);
            that.sendRuntimeGameDump();
          } else if (data.command === 'refresh') {
            that.sendRuntimeGameDump();
          } else if (data.command === 'set') {
            that.set(data.path, data.newValue);
          } else if (data.command === 'call') {
            that.call(data.path, data.args);
          } else if (data.command === 'profiler.start') {
            runtimeGame.startCurrentSceneProfiler(function (stoppedProfiler) {
              that.sendProfilerOutput(
                stoppedProfiler.getFramesAverageMeasures(),
                stoppedProfiler.getStats()
              );
              that.sendProfilerStopped();
            });
            that.sendProfilerStarted();
          } else if (data.command === 'profiler.stop') {
            runtimeGame.stopCurrentSceneProfiler();
          } else if (data.command === 'hotReload') {
            that._hotReloader.hotReload().then((logs) => {
              that.sendHotReloaderLogs(logs);
            });
          } else {
            logger.info(
              'Unknown command "' + data.command + '" received by the debugger.'
            );
          }
        } else {
          logger.info('Debugger received a message with badly formatted data.');
        }
      });

      const redirectJsLog = (
        type: 'info' | 'warning' | 'error',
        ...messages
      ) => {
        this.log(
          'JavaScript',
          messages.reduce(
            (accumulator, value) => accumulator + value,
            ''
          ),
          type,
          false
        );
      };

      // Hook the console logging functions to log to the Debugger as well
      console.log = (...messages) => {
        originalConsole.log(...messages);
        redirectJsLog('info', ...messages);
      };

      console.debug = (...messages) => {
        originalConsole.debug(...messages);
        redirectJsLog('info', ...messages);
      };

      console.info = (...messages) => {
        originalConsole.info(...messages);
        redirectJsLog('info', ...messages);
      };

      console.warn = (...messages) => {
        originalConsole.warn(...messages);
        redirectJsLog('warning', ...messages);
      };

      console.error = (...messages) => {
        originalConsole.error(...messages);
        redirectJsLog('error', ...messages);
      };

      // Overwrite the default GDJS log outputs so that they
      // both go to the console (or wherever they were configured to go)
      // and sent to the remote debugger.
      const existingLoggerOutput = gdjs.Logger.getLoggerOutput();
      gdjs.Logger.setLoggerOutput({
        log: (
          group: string,
          message: string,
          type: 'info' | 'warning' | 'error' = 'info',
          internal = true
        ) => {
          existingLoggerOutput.log(group, message, type, internal);
          this.log(group, message, type, internal);
        },
      });
    }

    _sendMessage(message: string) {
      if (!this._opener) return;

      try {
        this._opener.postMessage(
          message,
          '*'
        );
      } catch(error) {
        originalConsole.warn("Error while sending a message to the debugger:", error);
      }
    }

    log(
      group: string,
      message: string,
      type: 'info' | 'warning' | 'error',
      internal: boolean
    ) {
      if (!this._opener) {
        logger.warn('No connection to debugger opened to send logs');
        return;
      }

      this._sendMessage(
        JSON.stringify({
          command: 'console.log',
          payload: {
            message,
            type,
            group,
            internal,
            timestamp: performance.now(),
          },
        })
      );
    }

    set(path: string[], newValue: any): boolean {
      if (!path || !path.length) {
        logger.warn('No path specified, set operation from debugger aborted');
        return false;
      }
      let object = this._runtimegame;
      let currentIndex = 0;
      while (currentIndex < path.length - 1) {
        const key = path[currentIndex];
        if (!object || !object[key]) {
          logger.error('Incorrect path specified. No ' + key + ' in ', object);
          return false;
        }
        object = object[key];
        currentIndex++;
      }

      // Ensure the newValue is properly typed to avoid breaking anything in
      // the game engine.
      const currentValue = object[path[currentIndex]];
      if (typeof currentValue === 'number') {
        newValue = parseFloat(newValue);
      } else {
        if (typeof currentValue === 'string') {
          newValue = '' + newValue;
        }
      }
      logger.log('Updating', path, 'to', newValue);
      object[path[currentIndex]] = newValue;
      return true;
    }

    call(path: string[], args: any[]): boolean {
      if (!path || !path.length) {
        logger.warn('No path specified, call operation from debugger aborted');
        return false;
      }
      let object = this._runtimegame;
      let currentIndex = 0;
      while (currentIndex < path.length - 1) {
        const key = path[currentIndex];
        if (!object || !object[key]) {
          logger.error('Incorrect path specified. No ' + key + ' in ', object);
          return false;
        }
        object = object[key];
        currentIndex++;
      }
      if (!object[path[currentIndex]]) {
        logger.error('Unable to call', path);
        return false;
      }
      logger.log('Calling', path, 'with', args);
      object[path[currentIndex]].apply(object, args);
      return true;
    }

    sendRuntimeGameDump(): void {
      if (!this._opener) {
        logger.warn(
          'No connection to debugger opened to send RuntimeGame dump'
        );
        return;
      }
      const that = this;
      const message = { command: 'dump', payload: this._runtimegame };
      const serializationStartTime = Date.now();

      // Stringify the message, excluding some known data that are big and/or not
      // useful for the debugger.
      const excludedValues = [that._runtimegame.getGameData()];
      const excludedKeys = [
        // Exclude reference to the debugger
        '_debuggerClient',
        // Exclude some RuntimeScene fields:
        '_allInstancesList',
        // Exclude circular references to parent runtimeGame or runtimeScene:
        '_runtimeGame',
        '_runtimeScene',
        // Exclude some runtimeObject duplicated data:
        '_behaviorsTable',
        // Exclude some objects data:
        '_animations',
        '_animationFrame',
        // Exclude linked objects to avoid too much repetitions:
        'linkedObjectsManager',
        // Could be improved by using private fields and excluding these (_)
        // Exclude some behaviors data:
        '_platformRBush',
        // PlatformBehavior
        'HSHG',
        // Pathfinding
        '_obstaclesHSHG',
        // Pathfinding
        'owner',
        // Avoid circular reference from behavior to parent runtimeObject
        // Exclude rendering related objects:
        '_renderer',
        '_imageManager',
        // Exclude PIXI textures:
        'baseTexture',
        '_baseTexture',
        '_invalidTexture',
      ];
      const stringifiedMessage = this._circularSafeStringify(
        message,
        function (key, value) {
          if (
            excludedValues.indexOf(value) !== -1 ||
            excludedKeys.indexOf(key) !== -1
          ) {
            return '[Removed from the debugger]';
          }
          return value;
        },
        /* Limit maximum depth to prevent any crashes */
        18
      );
      const serializationDuration = Date.now() - serializationStartTime;
      logger.log(
        'RuntimeGame serialization took ' + serializationDuration + 'ms'
      );
      if (serializationDuration > 500) {
        logger.warn(
          'Serialization took a long time: please check if there is a need to remove some objects from serialization'
        );
      }
      this._sendMessage(stringifiedMessage);
    }

    sendHotReloaderLogs(logs: HotReloaderLog[]): void {
      if (!this._opener) {
        logger.warn('No connection to debugger opened');
        return;
      }
      this._sendMessage(
        this._circularSafeStringify({
          command: 'hotReloader.logs',
          payload: logs,
        })
      );
    }

    sendProfilerStarted(): void {
      if (!this._opener) {
        logger.warn('No connection to debugger opened');
        return;
      }
      this._sendMessage(
        this._circularSafeStringify({
          command: 'profiler.started',
          payload: null,
        })
      );
    }

    sendProfilerStopped(): void {
      if (!this._opener) {
        logger.warn('No connection to debugger opened');
        return;
      }
      this._sendMessage(
        this._circularSafeStringify({
          command: 'profiler.stopped',
          payload: null,
        })
      );
    }

    sendProfilerOutput(
      framesAverageMeasures: FrameMeasure,
      stats: ProfilerStats
    ): void {
      if (!this._opener) {
        logger.warn(
          'No connection to debugger opened to send profiler measures'
        );
        return;
      }
      this._sendMessage(
        this._circularSafeStringify({
          command: 'profiler.output',
          payload: {
            framesAverageMeasures: framesAverageMeasures,
            stats: stats,
          },
        })
      );
    }

    /**
     * This is an alternative to JSON.stringify that ensure that circular references
     * are replaced by a placeholder.
     * @param obj - The object to serialize.
     * @param [replacer] - A function called for each property on the object or array being stringified, with the property key and its value, and that returns the new value. If not specified, values are not altered.
     * @param [maxDepth] - The maximum depth, after which values are replaced by a string ("[Max depth reached]"). If not specified, there is no maximum depth.
     * @param [spaces] - The number of spaces for indentation.
     * @param [cycleReplacer] - Function used to replace circular references with a new value.
     */
    _circularSafeStringify(
      obj: any,
      replacer?: DebuggerClientCycleReplacer,
      maxDepth?: number,
      spaces?: number,
      cycleReplacer?: DebuggerClientCycleReplacer
    ) {
      return JSON.stringify(
        obj,
        this._depthLimitedSerializer(replacer, cycleReplacer, maxDepth),
        spaces
      );
    }

    /**
     * Generates a JSON serializer that prevent circular references and stop if maxDepth is reached.
     * @param [replacer] - A function called for each property on the object or array being stringified, with the property key and its value, and that returns the new value. If not specified, values are not altered.
     * @param [cycleReplacer] - Function used to replace circular references with a new value.
     * @param [maxDepth] - The maximum depth, after which values are replaced by a string ("[Max depth reached]"). If not specified, there is no maximum depth.
     */
    _depthLimitedSerializer(
      replacer?: DebuggerClientCycleReplacer,
      cycleReplacer?: DebuggerClientCycleReplacer,
      maxDepth?: number
    ): DebuggerClientCycleReplacer {
      const stack: Array<string> = [],
        keys: Array<string> = [];
      if (cycleReplacer === undefined || cycleReplacer === null) {
        cycleReplacer = function (key, value) {
          if (stack[0] === value) {
            return '[Circular ~]';
          }
          return (
            '[Circular ~.' + keys.slice(0, stack.indexOf(value)).join('.') + ']'
          );
        };
      }

      return function (key: string, value: any): any {
        if (stack.length > 0) {
          const thisPos = stack.indexOf(this);
          ~thisPos ? stack.splice(thisPos + 1) : stack.push(this);
          ~thisPos ? keys.splice(thisPos, Infinity, key) : keys.push(key);
          if (maxDepth != null && thisPos > maxDepth) {
            return '[Max depth reached]';
          } else {
            if (~stack.indexOf(value)) {
              value = (cycleReplacer as DebuggerClientCycleReplacer).call(
                this,
                key,
                value
              );
            }
          }
        } else {
          stack.push(value);
        }
        return replacer == null ? value : replacer.call(this, key, value);
      };
    }
  }

  //Register the class to let the engine use it.
  export const DebuggerClient = WindowMessageDebuggerClient;
}
