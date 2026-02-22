const vscode = require('vscode');

function activate(context) {
  const makeCmd = (text) => async () => {
    try {
      await vscode.env.clipboard.writeText(text);
      const open = 'Open Copilot Chat';
      const choice = await vscode.window.showInformationMessage(
        `Copied to clipboard: ${text}`,
        open
      );
      if (choice === open) {
        try {
          // Attempt to open Copilot Chat (best-effort)
          await vscode.commands.executeCommand('github.copilot-chat.open');
        } catch (err) {
          // Fallback: instruct user
          vscode.window.showInformationMessage(
            'Unable to open Copilot Chat automatically. Please open Copilot Chat and paste the command.'
          );
        }
      }
    } catch (err) {
      vscode.window.showErrorMessage(`Failed to copy command: ${String(err)}`);
    }
  };

  context.subscriptions.push(
    vscode.commands.registerCommand('conductor.copyStatus', makeCmd('/conductor.status')),
    vscode.commands.registerCommand('conductor.copySetup', makeCmd('/conductor.setup')),
    vscode.commands.registerCommand('conductor.copyNewTrack', makeCmd('/conductor.newTrack <title>')),
    vscode.commands.registerCommand('conductor.copyImplement', makeCmd('/conductor.implement <track_id>')),
    vscode.commands.registerCommand('conductor.copyRevert', makeCmd('/conductor.revert <track_id> <phase|task>'))
  );
}

function deactivate() {}

module.exports = { activate, deactivate };
