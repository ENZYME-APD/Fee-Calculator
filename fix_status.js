const fs = require('fs');

const modalFile = 'src/components/modals/ProjectSettingsModal.tsx';
let code = fs.readFileSync(modalFile, 'utf8');

const oldOptions = `<option value="Draft">Draft</option>
                  <option value="Active">Active</option>
                  <option value="Completed">Completed</option>
                  <option value="Archived">Archived</option>`;

const newOptions = `<option value="Draft">Draft</option>
                  <option value="Proposed">Proposed</option>
                  <option value="Active">Active</option>
                  <option value="Completed">Completed</option>
                  <option value="Lost">Lost</option>`;

code = code.replace(oldOptions, newOptions);

fs.writeFileSync(modalFile, code);
