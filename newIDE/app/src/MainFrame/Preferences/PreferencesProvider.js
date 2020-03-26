// @flow

import * as React from 'react';
import PreferencesContext, {
  initialPreferences,
  type Preferences,
  type AlertMessageIdentifier,
} from './PreferencesContext';
import { type FileMetadata } from '../../ProjectsStorage';
import optionalRequire from '../../Utils/OptionalRequire';
import { getIDEVersion } from '../../Version';
import type { PreferencesValues } from './PreferencesContext';
import type { ResourceKind } from '../../ResourcesList/ResourceSource.flow';
const electron = optionalRequire('electron');
const ipcRenderer = electron ? electron.ipcRenderer : null;

type Props = {|
  children: React.Node,
  disableCheckForUpdates: boolean,
|};

type State = Preferences;

const LocalStorageItem = 'gd-preferences';

export default class PreferencesProvider extends React.Component<Props, State> {
  state = {
    values: this._loadValuesFromLocalStorage() || initialPreferences.values,
    setLanguage: this._setLanguage.bind(this),
    setThemeName: this._setThemeName.bind(this),
    setCodeEditorThemeName: this._setCodeEditorThemeName.bind(this),
    setAutoDownloadUpdates: this._setAutoDownloadUpdates.bind(this),
    checkUpdates: this._checkUpdates.bind(this),
    setAutoDisplayChangelog: this._setAutoDisplayChangelog.bind(this),
    showAlertMessage: this._showAlertMessage.bind(this),
    verifyIfIsNewVersion: this._verifyIfIsNewVersion.bind(this),
    setEventsSheetShowObjectThumbnails: this._setEventsSheetShowObjectThumbnails.bind(
      this
    ),
    setAutosaveOnPreview: this._setAutosaveOnPreview.bind(this),
    setUseNewInstructionEditorDialog: this._setUseNewInstructionEditorDialog.bind(
      this
    ),
    setUseGDJSDevelopmentWatcher: this._setUseGDJSDevelopmentWatcher.bind(this),
    setEventsSheetUseAssignmentOperators: this._setEventsSheetUseAssignmentOperators.bind(
      this
    ),
    setShowEffectParameterNames: this._setShowEffectParameterNames.bind(this),
    getLastUsedPath: this._getLastUsedPath.bind(this),
    setLastUsedPath: this._setLastUsedPath.bind(this),
    getRecentFiles: this._getRecentFiles.bind(this),
    setRecentFiles: this._setRecentFiles.bind(this),
  };

  componentDidMount() {
    setTimeout(() => this._checkUpdates(), 10000);
  }

  _setLanguage(language: string) {
    this.setState(
      state => ({
        values: {
          ...state.values,
          language,
        },
      }),
      () => this._persistValuesToLocalStorage(this.state)
    );
  }

  _setEventsSheetShowObjectThumbnails(
    eventsSheetShowObjectThumbnails: boolean
  ) {
    this.setState(
      state => ({
        values: {
          ...state.values,
          eventsSheetShowObjectThumbnails,
        },
      }),
      () => this._persistValuesToLocalStorage(this.state)
    );
  }

  _setAutosaveOnPreview(autosaveOnPreview: boolean) {
    this.setState(
      state => ({
        values: {
          ...state.values,
          autosaveOnPreview,
        },
      }),
      () => this._persistValuesToLocalStorage(this.state)
    );
  }

  _setUseNewInstructionEditorDialog(useNewInstructionEditorDialog: boolean) {
    this.setState(
      state => ({
        values: {
          ...state.values,
          useNewInstructionEditorDialog,
        },
      }),
      () => this._persistValuesToLocalStorage(this.state)
    );
  }

  _setUseGDJSDevelopmentWatcher(useGDJSDevelopmentWatcher: boolean) {
    this.setState(
      state => ({
        values: {
          ...state.values,
          useGDJSDevelopmentWatcher,
        },
      }),
      () => this._persistValuesToLocalStorage(this.state)
    );
  }

  _setEventsSheetUseAssignmentOperators(
    eventsSheetUseAssignmentOperators: boolean
  ) {
    this.setState(
      state => ({
        values: {
          ...state.values,
          eventsSheetUseAssignmentOperators,
        },
      }),
      () => this._persistValuesToLocalStorage(this.state)
    );
  }

  _setShowEffectParameterNames(showEffectParameterNames: boolean) {
    this.setState(
      state => ({
        values: {
          ...state.values,
          showEffectParameterNames,
        },
      }),
      () => this._persistValuesToLocalStorage(this.state)
    );
  }

  _setThemeName(themeName: string) {
    this.setState(
      state => ({
        values: {
          ...state.values,
          themeName,
        },
      }),
      () => this._persistValuesToLocalStorage(this.state)
    );
  }

  _setCodeEditorThemeName(codeEditorThemeName: string) {
    this.setState(
      state => ({
        values: {
          ...state.values,
          codeEditorThemeName,
        },
      }),
      () => this._persistValuesToLocalStorage(this.state)
    );
  }

  _setAutoDownloadUpdates(autoDownloadUpdates: boolean) {
    this.setState(
      state => ({
        values: {
          ...state.values,
          autoDownloadUpdates,
        },
      }),
      () => this._persistValuesToLocalStorage(this.state)
    );
  }

  _setAutoDisplayChangelog(autoDisplayChangelog: boolean) {
    this.setState(
      state => ({
        values: {
          ...state.values,
          autoDisplayChangelog,
        },
      }),
      () => this._persistValuesToLocalStorage(this.state)
    );
  }

  _checkUpdates(forceDownload?: boolean) {
    // Checking for updates is only done on Electron.
    // Note: This could be abstracted away later if other updates mechanisms
    // should be supported.
    const { disableCheckForUpdates } = this.props;
    if (!ipcRenderer || disableCheckForUpdates) return;

    if (!!forceDownload || this.state.values.autoDownloadUpdates) {
      ipcRenderer.send('updates-check-and-download');
    } else {
      ipcRenderer.send('updates-check');
    }
  }

  _verifyIfIsNewVersion() {
    const currentVersion = getIDEVersion();
    const { lastLaunchedVersion } = this.state.values;
    if (lastLaunchedVersion === currentVersion) {
      // This is not a new version
      return false;
    }

    // This is a new version: store the version number
    this.setState(
      state => ({
        values: {
          ...state.values,
          lastLaunchedVersion: currentVersion,
        },
      }),
      () => this._persistValuesToLocalStorage(this.state)
    );

    if (lastLaunchedVersion === undefined) {
      // This is the first time GDevelop is launched, don't
      // warn about this version being new.
      return false;
    }

    return true;
  }

  _showAlertMessage(identifier: AlertMessageIdentifier, show: boolean) {
    this.setState(
      state => ({
        values: {
          ...state.values,
          hiddenAlertMessages: {
            ...state.values.hiddenAlertMessages,
            // $FlowFixMe - Flow won't typecheck this because of https://medium.com/flow-type/spreads-common-errors-fixes-9701012e9d58
            [identifier]: !show,
          },
        },
      }),
      () => this._persistValuesToLocalStorage(this.state)
    );
  }

  _loadValuesFromLocalStorage(): ?PreferencesValues {
    try {
      const persistedState = localStorage.getItem(LocalStorageItem);
      if (!persistedState) return null;

      const values = JSON.parse(persistedState);

      // "Migrate" non existing properties to their default values
      // (useful when upgrading the preferences to a new version where
      // a new preference was added).
      for (const key in initialPreferences.values) {
        if (
          initialPreferences.values.hasOwnProperty(key) &&
          typeof values[key] === 'undefined'
        ) {
          values[key] = initialPreferences.values[key];
        }
      }

      return values;
    } catch (e) {
      return null;
    }
  }

  _persistValuesToLocalStorage(preferences: Preferences) {
    try {
      localStorage.setItem(
        LocalStorageItem,
        JSON.stringify(preferences.values)
      );
    } catch (e) {
      console.warn('Unable to persist preferences', e);
    }

    return preferences;
  }

  _getLastUsedPath(project: gdProject, kind: ResourceKind) {
    const projectPath = project.getProjectFile();
    const { values } = this.state;
    const projectPaths = values.projectLastUsedPaths[projectPath];
    if (projectPaths && projectPaths[kind]) {
      return projectPaths[kind];
    }
    if (!projectPath) return null;
  }

  _setLastUsedPath(project: gdProject, kind: ResourceKind, latestPath: string) {
    const projectPath = project.getProjectFile();

    const { values } = this.state;
    const newProjectLastUsedPaths =
      values.projectLastUsedPaths[projectPath] || {};
    newProjectLastUsedPaths[kind] = latestPath;

    this.setState(
      {
        values: {
          ...values,
          projectLastUsedPaths: {
            ...values.projectLastUsedPaths,
            [projectPath]: newProjectLastUsedPaths,
          },
        },
      },
      () => this._persistValuesToLocalStorage(this.state)
    );
  }

  _getRecentFiles() {
    const { values } = this.state;
    if (values.recentFiles) {
      return values.recentFiles;
    }
    return null;
  }

  _setRecentFiles(data: FileMetadata) {
    const { values } = this.state;
    if (values.recentFiles.length >= 5) values.recentFiles.pop();
    if (
      !values.recentFiles.some(
        item => item.fileIdentifier === data.fileIdentifier
      )
    ) {
      this.setState(
        {
          values: {
            ...values,
            recentFiles: [data, ...values.recentFiles],
          },
        },
        () => this._persistValuesToLocalStorage(this.state)
      );
    }
  }

  render() {
    return (
      <PreferencesContext.Provider value={this.state}>
        {this.props.children}
      </PreferencesContext.Provider>
    );
  }
}
