// Automatically generated by GDevelop.js/scripts/generate-types.js
declare class gdEventsRefactorer {
  static renameObjectInEvents(platform: gdPlatform, project: gdObjectsContainer, layout: gdObjectsContainer, events: gdEventsList, oldName: string, newName: string): void;
  static removeObjectInEvents(platform: gdPlatform, project: gdObjectsContainer, layout: gdObjectsContainer, events: gdEventsList, name: string): void;
  static replaceStringInEvents(project: gdObjectsContainer, layout: gdObjectsContainer, events: gdEventsList, toReplace: string, newString: string, matchCase: boolean, inConditions: boolean, inActions: boolean, inEventStrings: boolean): void;
  static searchInEvents(platform: gdPlatform, events: gdEventsList, search: string, matchCase: boolean, inConditions: boolean, inActions: boolean, inEventStrings: boolean, inEventSentences: boolean): gdVectorEventsSearchResult;
  delete(): void;
  ptr: number;
};