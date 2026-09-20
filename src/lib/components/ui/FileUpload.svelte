<script lang="ts">
  import { UploadCloud, File as FileIcon, X, Image as ImageIcon } from 'lucide-svelte';
  import { createEventDispatcher } from 'svelte';

  export let accept: string = '*/*';
  export let multiple: boolean = false;
  export let maxSizeMB: number = 5;
  export let label: string = 'Drop files here or click to upload';

  const dispatch = createEventDispatcher();
  let isDragging = false;
  let fileInput: HTMLInputElement;
  let selectedFiles: {file: File, preview: string | null}[] = [];
  let errorMsg = '';

  function handleDragEnter(e: DragEvent) { e.preventDefault(); isDragging = true; }
  function handleDragLeave(e: DragEvent) { e.preventDefault(); isDragging = false; }
  function handleDragOver(e: DragEvent) { e.preventDefault(); }
  
  function handleDrop(e: DragEvent) {
    e.preventDefault();
    isDragging = false;
    if (e.dataTransfer?.files) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  }

  function handleFileInput(e: Event) {
    const target = e.target as HTMLInputElement;
    if (target.files) {
      processFiles(Array.from(target.files));
    }
  }

  function processFiles(files: File[]) {
    errorMsg = '';
    const validFiles = files.filter(f => {
      if (f.size > maxSizeMB * 1024 * 1024) {
        errorMsg = `Some files exceed ${maxSizeMB}MB limit`;
        return false;
      }
      return true;
    });

    if (!multiple) {
      validFiles.splice(1);
    }

    const newFiles = validFiles.map(f => ({
      file: f,
      preview: f.type.startsWith('image/') ? URL.createObjectURL(f) : null
    }));

    if (multiple) {
      selectedFiles = [...selectedFiles, ...newFiles];
    } else {
      selectedFiles = newFiles;
    }
    
    dispatch('files', { files: selectedFiles.map(f => f.file) });
  }

  function removeFile(index: number) {
    if (selectedFiles[index].preview) {
      URL.revokeObjectURL(selectedFiles[index].preview!);
    }
    selectedFiles = selectedFiles.filter((_, i) => i !== index);
    dispatch('files', { files: selectedFiles.map(f => f.file) });
  }
</script>

<div class="w-full">
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div 
    class="relative w-full p-8 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer overflow-hidden {isDragging ? 'border-emerald-500 bg-emerald-900/20' : 'border-stone-700 bg-stone-900 hover:border-emerald-500/50 hover:bg-stone-800'}"
    on:dragenter={handleDragEnter}
    on:dragleave={handleDragLeave}
    on:dragover={handleDragOver}
    on:drop={handleDrop}
    on:click={() => fileInput.click()}
  >
    <input 
      type="file" 
      bind:this={fileInput} 
      class="hidden" 
      {accept} 
      {multiple} 
      on:change={handleFileInput}
    />
    
    <div class="p-4 rounded-full bg-stone-800 mb-4 {isDragging ? 'text-emerald-400' : 'text-stone-400'}">
      <UploadCloud size={32} />
    </div>
    
    <p class="text-sm font-medium text-stone-200 mb-1">{label}</p>
    <p class="text-xs text-stone-500">Max size: {maxSizeMB}MB</p>
    
    {#if errorMsg}
      <p class="text-xs text-rose-500 mt-2">{errorMsg}</p>
    {/if}
  </div>

  {#if selectedFiles.length > 0}
    <div class="mt-4 flex flex-col gap-2">
      {#each selectedFiles as item, i}
        <div class="flex items-center justify-between p-3 rounded-lg bg-stone-800 border border-stone-700">
          <div class="flex items-center gap-3 overflow-hidden">
            {#if item.preview}
              <img src={item.preview} alt="preview" class="w-10 h-10 object-cover rounded" />
            {:else}
              <div class="w-10 h-10 rounded bg-stone-700 flex items-center justify-center text-stone-400">
                <FileIcon size={20} />
              </div>
            {/if}
            <div class="truncate text-sm">
              <p class="font-medium text-stone-200 truncate">{item.file.name}</p>
              <p class="text-xs text-stone-500">{(item.file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          </div>
          <button 
            on:click={() => removeFile(i)} 
            class="p-2 rounded hover:bg-stone-700 text-stone-400 hover:text-rose-400 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      {/each}
    </div>
  {/if}
</div>
