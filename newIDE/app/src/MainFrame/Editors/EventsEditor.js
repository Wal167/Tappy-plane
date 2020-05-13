// @flow
import * as React from 'react';
import EventsSheet from '../../EventsSheet';
import BaseEditor from './BaseEditor';

export default class EventsEditor extends BaseEditor {
  editor: ?EventsSheet;

  updateToolbar() {
    if (this.editor) this.editor.updateToolbar();
  }

  forceUpdateEditor() {
    // No updates to be done.
  }

  getLayout(): ?gdLayout {
    const { project, layoutName } = this.props;
    if (!project || !project.hasLayoutNamed(layoutName)) return null;

    return project.getLayout(layoutName);
  }

  render() {
    const { project, layoutName } = this.props;
    const layout = this.getLayout();
    if (!layout) {
      //TODO: Error component
      return <div>No layout called {layoutName} found!</div>;
    }

    return (
      <EventsSheet
        {...this.props}
        ref={editor => (this.editor = editor)}
        project={project}
        scope={{
          layout,
        }}
        globalObjectsContainer={project}
        objectsContainer={layout}
        events={layout.getEvents()}
        onPreview={options => this.props.onPreview(project, layout, options)}
        onOpenExternalEvents={this.props.onOpenExternalEvents}
        resourceSources={this.props.resourceSources}
        onChooseResource={this.props.onChooseResource}
        resourceExternalEditors={this.props.resourceExternalEditors}
        openInstructionOrExpression={this.props.openInstructionOrExpression}
        unsavedChanges={this.props.unsavedChanges}
      />
    );
  }
}
