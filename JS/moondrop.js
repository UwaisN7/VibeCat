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

    
        
 