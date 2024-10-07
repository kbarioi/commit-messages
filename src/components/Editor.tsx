import {editor} from "monaco-editor/esm/vs/editor/editor.api";
import { createEffect, createSignal, onCleanup, onMount } from "solid-js";

const {create} = editor;

const Editor = (props) => {
  let parent!: HTMLDivElement;
  const [e, setEditor] =
    createSignal<editor.IStandaloneCodeEditor>();
  onMount(() => {
    setEditor(
      create(parent, {
        language: "typescript",
        value: props.code,
      })
    );
    

    // createEffect(() => {
    //   editor()?.updateOptions({ readOnly: !!props.disabled });
    // });

    // if (props.linter) {
    //   editor()?.addAction({
    //     id: "eslint.executeAutofix",
    //     label: "Fix all auto-fixable problems",
    //     contextMenuGroupId: "1_modification",
    //     contextMenuOrder: 3.5,
    //     run: (ed) => {
    //       const code = ed.getValue();
    //       if (code) {
    //         props.linter?.postMessage({
    //           event: "FIX",
    //           code,
    //         });
    //       }
    //     },
    //   });
    // }

    //   editor.addCommand(KeyMod.CtrlCmd | KeyCode.KeyS, () => {
    //     // auto-format
    //     editor.getAction('editor.action.formatDocument')?.run();
    //     // auto-fix problems
    //     props.displayErrors && editor.getAction('eslint.executeAutofix')?.run();
    //     editor.focus();
    //   });

    e()?.onDidChangeModelContent(() => {
      const code = e()?.getValue();
      props.onDocChange?.(code);
      // runLinter(code);
    });
  });
  onCleanup(() => e()?.dispose());

  // createEffect(() => {
  //   monaco.languages.typescript?.typescriptDefaults?.setDiagnosticsOptions({
  //     noSemanticValidation: !props.displayErrors,
  //     noSyntaxValidation: !props.displayErrors,
  //   });
  // });

  return <div class="min-h-0 min-w-0 flex-1 w-full h-full p-0" ref={parent} />;
};

export default Editor;
