// popup.js

document.addEventListener('DOMContentLoaded', () => {
    const extensionListDiv = document.getElementById('extensionList');
    const toggleAllBtn = document.getElementById('toggleAllBtn');
    const loadingMessage = document.getElementById('loadingMessage');
    const messageBox = document.getElementById('messageBox');
    const messageText = document.getElementById('messageText');
    const closeMessageBox = document.getElementById('closeMessageBox');

    // Function to display a message in a custom modal
    function showMessage(message) {
        messageText.textContent = message;
        messageBox.classList.remove('hidden');
    }

    // Close message box
    closeMessageBox.addEventListener('click', () => {
        messageBox.classList.add('hidden');
    });

    // Function to render the list of extensions
    async function renderExtensionList() {
        try {
            loadingMessage.classList.remove('hidden'); // Show loading message
            extensionListDiv.innerHTML = ''; // Clear existing list

            // Get all installed extensions
            const extensions = await chrome.management.getAll();

            // Filter out the current extension itself and themes
            const manageableExtensions = extensions.filter(ext =>
                ext.id !== chrome.runtime.id && ext.type !== 'theme'
            );

            if (manageableExtensions.length === 0) {
                extensionListDiv.innerHTML = '<p class="text-center text-gray-500 py-4">No other extensions found.</p>';
                loadingMessage.classList.add('hidden');
                return;
            }

            // Create UI for each extension
            manageableExtensions.forEach(ext => {
                const extItem = document.createElement('div');
                extItem.className = 'extension-item bg-white hover:bg-gray-50 transition-colors duration-200';

                const extName = document.createElement('span');
                extName.className = 'text-gray-800 font-medium truncate';
                extName.textContent = ext.name;
                extName.title = ext.name; // Add title for full name on hover

                const toggleLabel = document.createElement('label');
                toggleLabel.className = 'toggle-switch';

                const toggleInput = document.createElement('input');
                toggleInput.type = 'checkbox';
                toggleInput.checked = ext.enabled; // Set initial state
                toggleInput.id = `toggle-${ext.id}`; // Unique ID for each toggle

                const sliderSpan = document.createElement('span');
                sliderSpan.className = 'slider';

                toggleLabel.appendChild(toggleInput);
                toggleLabel.appendChild(sliderSpan);

                // Event listener for toggling individual extension
                toggleInput.addEventListener('change', async (event) => {
                    const isEnabled = event.target.checked;
                    try {
                        await chrome.management.setEnabled(ext.id, isEnabled);
                        // No need to re-render the whole list, the UI already reflects the change
                        console.log(`${ext.name} ${isEnabled ? 'enabled' : 'disabled'}`);
                    } catch (error) {
                        console.error(`Error toggling ${ext.name}:`, error);
                        showMessage(`Failed to toggle "${ext.name}". Please try again.`);
                        // Revert the toggle state if there was an error
                        event.target.checked = !isEnabled;
                    }
                });

                extItem.appendChild(extName);
                extItem.appendChild(toggleLabel);
                extensionListDiv.appendChild(extItem);
            });
        } catch (error) {
            console.error('Error fetching extensions:', error);
            extensionListDiv.innerHTML = '<p class="text-center text-red-500 py-4">Error loading extensions.</p>';
            showMessage('Could not load extensions. Please ensure the "management" permission is granted.');
        } finally {
            loadingMessage.classList.add('hidden'); // Hide loading message
        }
    }

    // Function to toggle all extensions
    toggleAllBtn.addEventListener('click', async () => {
        try {
            const extensions = await chrome.management.getAll();
            const manageableExtensions = extensions.filter(ext =>
                ext.id !== chrome.runtime.id && ext.type !== 'theme'
            );

            if (manageableExtensions.length === 0) {
                showMessage('No other extensions to toggle.');
                return;
            }

            // Determine the target state: if any extension is enabled, disable all. Otherwise, enable all.
            const anyEnabled = manageableExtensions.some(ext => ext.enabled);
            const targetState = !anyEnabled;

            // Toggle each extension
            for (const ext of manageableExtensions) {
                try {
                    await chrome.management.setEnabled(ext.id, targetState);
                    // Update the UI checkbox state directly
                    const toggleInput = document.getElementById(`toggle-${ext.id}`);
                    if (toggleInput) {
                        toggleInput.checked = targetState;
                    }
                } catch (error) {
                    console.error(`Error toggling ${ext.name}:`, error);
                    showMessage(`Failed to toggle "${ext.name}". Some extensions might not have changed.`);
                }
            }
            showMessage(`All extensions ${targetState ? 'enabled' : 'disabled'}.`);
        } catch (error) {
            console.error('Error toggling all extensions:', error);
            showMessage('An error occurred while trying to toggle all extensions.');
        }
    });

    // Initial render of the extension list
    renderExtensionList();
});
