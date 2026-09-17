(function setupMoonDrop() {
            const dropZone = document.getElementById('dropZone');
            const fileInput = document.getElementById('fileInput');
 
            ['dragenter', 'dragover'].forEach(evt =>
                dropZone.addEventListener(evt, (e) => {
                    e.preventDefault();
                    dropZone.classList.add('is-drag-over');
                })
            );
 
            ['dragleave', 'drop'].forEach(evt =>
                dropZone.addEventListener(evt, (e) => {
                    e.preventDefault();
                    dropZone.classList.remove('is-drag-over');
                })
            );
 
            dropZone.addEventListener('drop', (e) => {
                const files = e.dataTransfer.files;
                if (files && files.length) {
                    fileInput.files = files;
                    fileInput.dispatchEvent(new Event('change', { bubbles: true }));
                }
            });
        })();

        
        // ---- 2. Moon as a drop zone ----
        // The <label for="fileInput"> already makes clicking the moon open the
        // file picker for free - that's just normal HTML behaviour, no JS needed.
        // Drag-and-drop needs a little help though: we add a class for visual
        // feedback, and forward any dropped file into the real <input> so
        // songs.js (which already listens for "change" on #fileInput) can
        // pick it up without knowing anything about drag-and-drop.
        
 