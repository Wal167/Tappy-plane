// Automatically generated by GDevelop.js/scripts/generate-types.js
// Automatically generated by GDevelop.js/scripts/generate-types.js
// Automatically generated by GDevelop.js/scripts/generate-types.js
// Automatically generated by GDevelop.js/scripts/generate-types.js
declare class gdEventsFunctionsContainer {
  insertNewEventsFunction(name: string, pos: number): gdEventsFunction;
  insertEventsFunction(eventsFunction: gdEventsFunction, pos: number): gdEventsFunction;
  hasEventsFunctionNamed(name: string): boolean;
  getEventsFunction(name: string): gdEventsFunction;
  getEventsFunctionAt(pos: number): gdEventsFunction;
  removeEventsFunction(name: string): void;
  moveEventsFunction(oldIndex: number, newIndex: number): void;
  getEventsFunctionsCount(): number;
  getEventsFunctionPosition(eventsFunction: gdEventsFunction): number;
  delete(): void;
  ptr: number;
};