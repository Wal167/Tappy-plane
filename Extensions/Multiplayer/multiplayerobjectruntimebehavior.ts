/*
  GDevelop - Multiplayer Object Behavior Extension
  Copyright (c) 2013-2016 Florian Rival (Florian.Rival@gmail.com)
*/

namespace gdjs {
  const logger = new gdjs.Logger('Multiplayer');
  /**
   * The MultiplayerObjectRuntimeBehavior represents a behavior that can be added to objects
   * to make them synchronized over the network.
   */
  export class MultiplayerObjectRuntimeBehavior extends gdjs.RuntimeBehavior {
    // Which player is the owner of the object.
    // If 0, then the object is not owned by any player, so the server is the owner.
    _playerNumber: number = 0;
    // The last time the object has been synchronized.
    // This is to avoid synchronizing the object too often, see _objectTickRate.
    _lastObjectSyncTimestamp: number = 0;
    // The number of times per second the object should be synchronized.
    _objectTickRate: number = 60;

    // The last time the variables have been synchronized.
    _lastVariablesSyncTimestamp: number = 0;
    // The number of times per second the variables should be synchronized.
    _variablesTickRate: number = 2;
    // The last data sent to synchronize the variables.
    _lastSentVariableSyncData: VariableSyncData[] | undefined;
    // When we know that the variables have been updated, we can force sending them
    // on the same tickrate as the object update for a number of times
    // to ensure they are received, without the need of an acknowledgment.
    _numberOfForcedVariablesUpdates: number = 0;

    // The last time the effects have been synchronized.
    _lastEffectsSyncTimestamp: number = 0;
    // The number of times per second the effects should be synchronized.
    _effectsTickRate: number = 2;
    // The last data sent to synchronize the effects.
    _lastSentEffectSyncData:
      | { [effectName: string]: EffectSyncData }
      | undefined;
    // When we know that the effects have been updated, we can force sending them
    // on the same tickrate as the object update for a number of times
    // to ensure they are received, without the need of an acknowledgment.
    _numberOfForcedEffectsUpdates: number = 0;

    // To avoid seeing too many logs.
    _lastLogTimestamp: number = 0;
    _logTickRate: number = 1;
    _getTimeNow: () => number;
    // Clock to be incremented every time we send a message, to ensure they are ordered
    // and old messages are ignored.
    _clock: number = 0;
    _destroyInstanceTimeoutId: NodeJS.Timeout | null = null;

    constructor(
      instanceContainer: gdjs.RuntimeInstanceContainer,
      behaviorData,
      owner: RuntimeObject
    ) {
      super(instanceContainer, behaviorData, owner);
      this._getTimeNow =
        window.performance && typeof window.performance.now === 'function'
          ? window.performance.now.bind(window.performance)
          : Date.now;
      // When a synchronized object is created, we assume it will be assigned a networkId quickly if:
      // - It is a new object created by the current player. -> will be assigned a networkId when sending the update message.
      // - It is an object created by another player. -> will be assigned a networkId when receiving the update message.
      // There is a small risk that the object is created by us after we receive an update message from the server,
      // ending up with 2 objects created, one with a networkId (from the server) and one without (from us).
      // To handle this case and avoid having an object not synchronized, we set a timeout to destroy the object
      // if it has not been assigned a networkId after a short delay.

      this._destroyInstanceTimeoutId = setTimeout(() => {
        if (!owner.networkId) {
          logger.info(
            `Object ${owner.getName()} has not been assigned a networkId after a short delay, destroying it.`
          );
          owner.deleteFromScene(instanceContainer);
        }
      }, 500);
    }

    sendDataToPeersWithIncreasedClock(messageName: string, data: Object) {
      this._clock++;
      data['_clock'] = this._clock;
      const connectedPeerIds = gdjs.evtTools.p2p.getAllPeers();
      for (const peerId of connectedPeerIds) {
        gdjs.multiplayerMessageManager.sendDataTo(peerId, messageName, data);
      }
    }

    isOwnerOrServer() {
      const currentPlayerNumber =
        gdjs.multiplayer.getCurrentPlayerPositionInLobby();

      const isOwnerOfObject =
        currentPlayerNumber === this._playerNumber || // Player as owner.
        (currentPlayerNumber === 1 && this._playerNumber === 0); // Server as owner.

      return isOwnerOfObject;
    }

    hasObjectBeenSyncedRecently() {
      return (
        this._getTimeNow() - this._lastObjectSyncTimestamp <
        1000 / this._objectTickRate
      );
    }

    haveVariablesBeenSyncedRecently() {
      return (
        this._getTimeNow() - this._lastVariablesSyncTimestamp <
        1000 / this._variablesTickRate
      );
    }

    haveEffectsBeenSyncedRecently() {
      return (
        this._getTimeNow() - this._lastEffectsSyncTimestamp <
        1000 / this._effectsTickRate
      );
    }

    logToConsole(message: string) {
      if (
        this._getTimeNow() - this._lastLogTimestamp >
        1000 / this._logTickRate
      ) {
        logger.info(message);
        this._lastLogTimestamp = this._getTimeNow();
      }
    }

    getOrCreateInstanceNetworkId() {
      if (!this.owner.networkId) {
        // no ID for this object, let's generate one so it can be identified by other players.
        // Either use the persistentUuid if it exists, or generate a new one.
        // Keep it short to avoid sending too much data.
        const newID = this.owner.persistentUuid
          ? this.owner.persistentUuid.substring(0, 8)
          : gdjs.makeUuid().substring(0, 8);
        this.owner.networkId = newID;
      }

      return this.owner.networkId;
    }

    areVariablesDifferentFromLastSync(variablesSyncData: VariableSyncData[]) {
      if (!this._lastSentVariableSyncData) {
        return true;
      }

      // Compare the json of the variables to check if they are different.
      // This is not the most efficient way to do it, but it's simple and should work.
      const haveVariableSyncDataChanged =
        JSON.stringify(variablesSyncData) !==
        JSON.stringify(this._lastSentVariableSyncData);

      if (haveVariableSyncDataChanged) {
        console.info(
          'variables have changed',
          variablesSyncData,
          this._lastSentVariableSyncData
        );
      }

      return haveVariableSyncDataChanged;
    }

    areEffectsDifferentFromLastSync(effectsSyncData: {
      [effectName: string]: EffectSyncData;
    }) {
      if (!this._lastSentEffectSyncData) {
        return true;
      }

      for (const effectName in effectsSyncData) {
        if (!effectsSyncData.hasOwnProperty(effectName)) {
          continue;
        }

        const effectSyncData = effectsSyncData[effectName];
        const effectEnabled = effectSyncData.ena;
        const effectFilterCreator = effectSyncData.fc;

        const effectInLastSync = this._lastSentEffectSyncData[effectName];

        if (!effectInLastSync || effectInLastSync.ena !== effectEnabled) {
          return true;
        }

        for (const parameterName in effectFilterCreator) {
          if (!effectFilterCreator.hasOwnProperty(parameterName)) {
            continue;
          }

          const parameterValue = effectFilterCreator[parameterName];
          const lastParameterValueSent = effectInLastSync.fc[parameterName];
          if (lastParameterValueSent !== parameterValue) {
            return true;
          }
        }
      }

      return false;
    }

    doStepPostEvents() {
      if (!this.isOwnerOrServer()) {
        return;
      }

      // If the object has been synchronized recently, then return.
      if (this.hasObjectBeenSyncedRecently()) {
        return;
      }

      // this.logToConsole(
      //   `Synchronizing object ${this.owner.getName()} (instance ${
      //     this.owner.networkId
      //   }) with player ${this._playerNumber}`
      // );

      const instanceNetworkId = this.getOrCreateInstanceNetworkId();
      const objectName = this.owner.getName();
      const objectNetworkSyncData = this.owner.getObjectNetworkSyncData();

      const areVariablesDifferent =
        objectNetworkSyncData.var &&
        this.areVariablesDifferentFromLastSync(objectNetworkSyncData.var);
      const shouldSyncVariables =
        !this.haveVariablesBeenSyncedRecently() ||
        areVariablesDifferent ||
        this._numberOfForcedVariablesUpdates > 0;
      if (areVariablesDifferent) {
        this._numberOfForcedVariablesUpdates = 3;
      }
      if (!shouldSyncVariables) {
        delete objectNetworkSyncData.var;
      }

      const areEffectsDifferent =
        objectNetworkSyncData.eff &&
        this.areEffectsDifferentFromLastSync(objectNetworkSyncData.eff);
      const shoundSyncEffects =
        !this.haveEffectsBeenSyncedRecently() ||
        areEffectsDifferent ||
        this._numberOfForcedEffectsUpdates > 0;
      if (areEffectsDifferent) {
        this._numberOfForcedEffectsUpdates = 3;
      }
      if (!shoundSyncEffects) {
        delete objectNetworkSyncData.eff;
      }

      const { messageName: updateMessageName, messageData: updateMessageData } =
        gdjs.multiplayerMessageManager.createUpdateObjectMessage({
          objectOwner: this._playerNumber,
          objectName,
          instanceNetworkId,
          objectNetworkSyncData,
        });
      this.sendDataToPeersWithIncreasedClock(
        updateMessageName,
        updateMessageData
      );

      this.logToConsole(
        `Synchronizing object ${this.owner.getName()} (instance ${
          this.owner.networkId
        }) with player ${this._playerNumber} and data ${JSON.stringify(
          objectNetworkSyncData
        )}`
      );

      const now = this._getTimeNow();

      this._lastObjectSyncTimestamp = now;
      if (shouldSyncVariables) {
        // if (this.owner.getName() === 'Player1') {
        //   console.info('variables have been synced', objectNetworkSyncData.var);
        // }
        this._lastVariablesSyncTimestamp = now;
        this._lastSentVariableSyncData = objectNetworkSyncData.var;
        this._numberOfForcedVariablesUpdates = Math.max(
          this._numberOfForcedVariablesUpdates - 1,
          0
        );
      }
      if (shoundSyncEffects) {
        // console.info('effects have been synced', areEffectsDifferent);
        this._lastEffectsSyncTimestamp = now;
        this._lastSentEffectSyncData = objectNetworkSyncData.eff;
        this._numberOfForcedEffectsUpdates = Math.max(
          this._numberOfForcedEffectsUpdates - 1,
          0
        );
      }
    }

    onDestroy() {
      if (this._destroyInstanceTimeoutId) {
        clearTimeout(this._destroyInstanceTimeoutId);
        this._destroyInstanceTimeoutId = null;
      }

      if (!this.isOwnerOrServer()) {
        return;
      }

      const instanceNetworkId = this.owner.networkId;
      const objectName = this.owner.getName();

      // If it had no networkId, then it was not synchronized and we don't need to send a message.
      if (!instanceNetworkId) {
        logger.info(
          `Destroying object ${objectName} without networkId, no need to send a message.`
        );
        return;
      }
      // Ensure we send a final update before the object is destroyed, if it had a networkId.
      logger.info(
        `Sending a final update for object ${objectName} (instance ${instanceNetworkId}) before it is destroyed.`
      );
      const { messageName: updateMessageName, messageData: updateMessageData } =
        gdjs.multiplayerMessageManager.createUpdateObjectMessage({
          objectOwner: this._playerNumber,
          objectName,
          instanceNetworkId,
          objectNetworkSyncData: this.owner.getObjectNetworkSyncData(),
        });
      this.sendDataToPeersWithIncreasedClock(
        updateMessageName,
        updateMessageData
      );

      // Before sending the destroy message, we set up the object representing the peers
      // that we need an acknowledgment from.
      // If we are player 1, we are connected to everyone, so we expect an acknowledgment from everyone.
      // If we are another player, we are only connected to player 1, so we expect an acknowledgment from player 1.
      // In both cases, this represents the list of peers the current user is connected to.
      const otherPeerIds = gdjs.evtTools.p2p.getAllPeers();
      const {
        messageName: destroyMessageName,
        messageData: destroyMessageData,
      } = gdjs.multiplayerMessageManager.createDestroyObjectMessage({
        objectOwner: this._playerNumber,
        objectName,
        instanceNetworkId,
      });
      const destroyedMessageName =
        gdjs.multiplayerMessageManager.createObjectDestroyedMessageNameFromDestroyMessage(
          destroyMessageName
        );
      gdjs.multiplayerMessageManager.addExpectedMessageAcknowledgement({
        originalMessageName: destroyMessageName,
        originalData: {
          ...destroyMessageData,
          _clock: this._clock + 1, // Will be incremented by the time the message is sent.
        },
        expectedMessageName: destroyedMessageName,
        otherPeerIds,
      });

      this.sendDataToPeersWithIncreasedClock(
        destroyMessageName,
        destroyMessageData
      );
    }

    setPlayerObjectOwnership(newPlayerNumber: number) {
      logger.info(
        `Setting ownership of object ${this.owner.getName()} to player ${newPlayerNumber}.`
      );
      if (newPlayerNumber < 0) {
        console.error(
          'Invalid player number (' +
            newPlayerNumber +
            ') when setting ownership of an object.'
        );
        return;
      }

      let instanceNetworkId = this.owner.networkId;

      if (!instanceNetworkId) {
        console.info(
          'Object has no networkId, we change the ownership locally, but it will not be synchronized yet if we are not the owner.'
        );
        this._playerNumber = newPlayerNumber;
        if (
          newPlayerNumber !== gdjs.multiplayer.getCurrentPlayerPositionInLobby()
        ) {
          // If we are not the new owner, we should not send a message to the server to change the ownership.
          // Just return and wait to receive an update message to reconcile this object.
          return;
        }
      }

      const currentPlayerNumber =
        gdjs.multiplayer.getCurrentPlayerPositionInLobby();
      const objectName = this.owner.getName();

      if (instanceNetworkId) {
        // When changing the ownership of an object with a networkId, we send a message to the server to ensure it is aware of the change,
        // and can either accept it and broadcast it to other players, or reject it and do nothing with it.
        // We expect an acknowledgment from the server, if not, we will retry and eventually revert the ownership.
        const { messageName, messageData } =
          gdjs.multiplayerMessageManager.createChangeOwnerMessage({
            objectOwner: this._playerNumber,
            objectName,
            instanceNetworkId,
            newObjectOwner: newPlayerNumber,
            instanceX: this.owner.getX(),
            instanceY: this.owner.getY(),
          });
        // Before sending the changeOwner message, if we are becoming the new owner,
        // we want to ensure this message is acknowledged, by everyone we're connected to.
        // If we are player 1, we are connected to everyone, so we expect an acknowledgment from everyone.
        // If we are another player, we are only connected to player 1, so we expect an acknowledgment from player 1.
        // In both cases, this represents the list of peers the current user is connected to.
        if (newPlayerNumber === currentPlayerNumber) {
          const otherPeerIds = gdjs.evtTools.p2p.getAllPeers();
          const changeOwnerAcknowledgedMessageName =
            gdjs.multiplayerMessageManager.createObjectOwnerChangedMessageNameFromChangeOwnerMessage(
              messageName
            );
          gdjs.multiplayerMessageManager.addExpectedMessageAcknowledgement({
            originalMessageName: messageName,
            originalData: {
              ...messageData,
              _clock: this._clock + 1, // Will be incremented by the time the message is sent.
            },
            expectedMessageName: changeOwnerAcknowledgedMessageName,
            otherPeerIds,
            // If we are not the server, we should revert the ownership if the server does not acknowledge the change.
            shouldCancelMessageIfTimesOut: currentPlayerNumber !== 1,
          });
        }

        this.sendDataToPeersWithIncreasedClock(messageName, messageData);
      }

      // We also update the ownership locally, so the object can be used immediately.
      // This is a prediction to allow snappy interactions.
      // If we are player 1 or server, we will have the ownership immediately anyway.
      // If we are another player, we will have the ownership as soon as the server acknowledges the change.
      // If the server does not send an acknowledgment, we will revert the ownership.
      this._playerNumber = newPlayerNumber;

      // If we are the new owner, also send directly an update of the position,
      // so that the object is immediately moved on the screen and we don't wait for the next tick.
      if (newPlayerNumber === currentPlayerNumber) {
        if (!instanceNetworkId) {
          // If we don't have a networkId, we need to create one now that we are the owner.
          // We are probably in a case where we created the object and then changed the ownership.
          instanceNetworkId = this.getOrCreateInstanceNetworkId();
        }

        const objectNetworkSyncData = this.owner.getObjectNetworkSyncData();
        const {
          messageName: updateMessageName,
          messageData: updateMessageData,
        } = gdjs.multiplayerMessageManager.createUpdateObjectMessage({
          objectOwner: this._playerNumber,
          objectName,
          instanceNetworkId,
          objectNetworkSyncData,
        });
        logger.info(
          `Sending a first update as new owner of object ${objectName} (instance ${instanceNetworkId}).`
        );
        this.sendDataToPeersWithIncreasedClock(
          updateMessageName,
          updateMessageData
        );
      }
    }

    getPlayerObjectOwnership(): number {
      return this._playerNumber;
    }

    removeObjectOwnership() {
      // 0 means the server is the owner.
      this.setPlayerObjectOwnership(0);
    }
  }
  gdjs.registerBehavior(
    'Multiplayer::MultiplayerObjectBehavior',
    gdjs.MultiplayerObjectRuntimeBehavior
  );
}
