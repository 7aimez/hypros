// File System
let fileSystem = {
    root: {
        type: 'folder',
        children: {
            'Home': {
                type: 'folder',
                children: {
                    'Documents': {
                        type: 'folder',
                        children: {
                            'welcome.txt': { type: 'file', content: 'Welcome to HyprOS!\n\nThis is your personal file system.\nYou can create, edit, and delete files.\n\nTry opening the Text Editor to create new files.', lastModified: Date.now() },
                            'todo.txt': { type: 'file', content: '- [ ] Explore the system\n- [ ] Create some files\n- [ ] Customize desktop', lastModified: Date.now() }
                        }
                    },
                    'Pictures': { type: 'folder', children: {} },
                    'Music': { type: 'folder', children: {} },
                    'Downloads': { type: 'folder', children: {} }
                }
            }
        }
    },
    trash: {}
};

let quickLinks = [
    { name: 'Google', url: 'https://google.com', icon: 'fa-google', color: 'text-blue-400' },
    { name: 'GitHub', url: 'https://github.com', icon: 'fa-github', color: 'text-white' },
    { name: 'YouTube', url: 'https://youtube.com', icon: 'fa-youtube', color: 'text-red-400' },
    { name: 'Reddit', url: 'https://reddit.com', icon: 'fa-reddit', color: 'text-orange-400' }
];

let desktopIcons = [
    { id: 'home', name: 'Home', icon: 'fa-folder', color: 'text-yellow-400', x: 20, y: 20, path: ['Home'] },
    { id: 'docs', name: 'Documents', icon: 'fa-file-alt', color: 'text-blue-400', x: 20, y: 120, path: ['Home', 'Documents'] },
    { id: 'trash', name: 'Trash', icon: 'fa-trash', color: 'text-gray-400', x: 20, y: 220, path: null, isTrash: true }
];

let state = {
    wallpaper: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2070&auto=format&fit=crop',
    volume: 75,
    glow: true,
    activeWorkspace: 1,
    windows: [],
    musicFiles: [],
    selectedFiles: new Set(),
    clipboard: null
};

const apps = [
    { id: 'terminal', name: 'Terminal', icon: 'fa-terminal', color: 'text-green-400' },
    { id: 'files', name: 'Files', icon: 'fa-folder', color: 'text-yellow-400' },
    { id: 'browser', name: 'Browser', icon: 'fa-firefox', color: 'text-orange-500' },
    { id: 'code', name: 'Code Editor', icon: 'fa-code', color: 'text-blue-400' },
    { id: 'music', name: 'Music', icon: 'fa-music', color: 'text-pink-400' },
    { id: 'calculator', name: 'Calculator', icon: 'fa-calculator', color: 'text-cyan-400' },
    { id: 'paint', name: 'Paint', icon: 'fa-paint-brush', color: 'text-purple-400' },
    { id: 'settings', name: 'Settings', icon: 'fa-cog', color: 'text-hypr-accent' },
];

const recentFiles = [
    { name: 'project.py', icon: 'fa-file-code', color: 'text-blue-400', path: '~/dev' },
    { name: 'notes.md', icon: 'fa-file-alt', color: 'text-white', path: '~/docs' },
    { name: 'screenshot.png', icon: 'fa-image', color: 'text-green-400', path: '~/pics' },
];

const els = {
    wallpaper: document.getElementById('wallpaper'),
    wallpaperDim: document.getElementById('wallpaper-dim'),
    launcher: document.getElementById('launcher'),
    appsGrid: document.getElementById('apps-grid'),
    quickLinksList: document.getElementById('quick-links-list'),
    recentFiles: document.getElementById('recent-files'),
    windowsContainer: document.getElementById('windows-container'),
    settingsWindow: document.getElementById('settings-window'),
    settingsHeader: document.getElementById('settings-header'),
    notifications: document.getElementById('notifications'),
    activeWindowIndicator: document.getElementById('active-window-indicator'),
    windowTitleText: document.getElementById('window-title-text'),
    powerMenu: document.getElementById('power-menu'),
    desktopIcons: document.getElementById('desktop-icons'),
    contextMenu: document.getElementById('context-menu'),
    globalSearch: document.getElementById('global-search')
};

// Initialize
function init() {
    loadState();
    renderDesktopIcons();
    renderApps();
    renderQuickLinks();
    updateSystemInfo();
    setInterval(updateSystemInfo, 2000);
    setupGlobalEvents();
    setupSearchBar();
}

function setupSearchBar() {
    els.globalSearch.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const query = els.globalSearch.value.trim();
            if (!query) return;
            
            // Check if it's a URL
            if (query.includes('.') && !query.includes(' ')) {
                // Looks like a URL
                let url = query;
                if (!url.startsWith('http')) {
                    url = 'https://' + url;
                }
                openApp('browser');
                // Set the URL in the browser after it opens
                setTimeout(() => {
                    const browserWin = state.windows.find(w => w.app.id === 'browser');
                    if (browserWin) {
                        const urlInput = document.getElementById(`url-${browserWin.id}`);
                        const iframe = document.getElementById(`iframe-${browserWin.id}`);
                        if (urlInput && iframe) {
                            urlInput.value = url;
                            iframe.src = url;
                        }
                    }
                }, 100);
            } else {
                // Search query
                searchWeb();
            }
            els.globalSearch.value = '';
        }
    });
}

function loadState() {
    const saved = localStorage.getItem('hypros_complete');
    if (saved) {
        const data = JSON.parse(saved);
        fileSystem = data.fileSystem || fileSystem;
        quickLinks = data.quickLinks || quickLinks;
        desktopIcons = data.desktopIcons || desktopIcons;
        state.wallpaper = data.wallpaper || state.wallpaper;
        state.volume = data.volume || 75;
        state.glow = data.glow !== undefined ? data.glow : true;
        
        els.wallpaper.style.backgroundImage = `url('${state.wallpaper}')`;
    }
}

function saveState() {
    localStorage.setItem('hypros_complete', JSON.stringify({
        fileSystem,
        quickLinks,
        desktopIcons,
        wallpaper: state.wallpaper,
        volume: state.volume,
        glow: state.glow
    }));
}

// Desktop Icons - FIXED
function renderDesktopIcons() {
    els.desktopIcons.innerHTML = '';
    desktopIcons.forEach(icon => {
        const iconEl = document.createElement('div');
        iconEl.className = 'desktop-icon';
        iconEl.id = `desktop-icon-${icon.id}`;
        iconEl.style.left = icon.x + 'px';
        iconEl.style.top = icon.y + 'px';
        
        iconEl.innerHTML = `
            <i class="fas ${icon.icon} text-4xl ${icon.color} drop-shadow-lg"></i>
            <span class="desktop-icon-name">${icon.name}</span>
        `;
        
        // Mouse events
        iconEl.addEventListener('mousedown', (e) => handleIconMouseDown(e, icon.id));
        iconEl.addEventListener('click', (e) => handleIconClick(e, icon.id));
        iconEl.addEventListener('dblclick', (e) => handleIconDoubleClick(e, icon.id));
        iconEl.addEventListener('contextmenu', (e) => showIconContextMenu(e, icon.id));
        
        // Touch events
        iconEl.addEventListener('touchstart', (e) => handleIconTouchStart(e, icon.id), { passive: false });
        iconEl.addEventListener('touchmove', (e) => handleIconTouchMove(e, icon.id), { passive: false });
        iconEl.addEventListener('touchend', (e) => handleIconTouchEnd(e, icon.id));
        
        els.desktopIcons.appendChild(iconEl);
    });
}

let draggedIconId = null;
let iconDragOffset = { x: 0, y: 0 };
let iconTouchStartTime = 0;
let iconTouchMoved = false;

function handleIconMouseDown(e, iconId) {
    if (e.button !== 0) return; // Only left click
    e.stopPropagation();
    
    const icon = desktopIcons.find(i => i.id === iconId);
    iconDragOffset.x = e.clientX - icon.x;
    iconDragOffset.y = e.clientY - icon.y;
    draggedIconId = iconId;
    
    document.getElementById(`desktop-icon-${iconId}`).classList.add('dragging');
    
    document.addEventListener('mousemove', handleIconMouseMove);
    document.addEventListener('mouseup', handleIconMouseUp);
}

function handleIconMouseMove(e) {
    if (!draggedIconId) return;
    
    const icon = desktopIcons.find(i => i.id === draggedIconId);
    icon.x = Math.max(0, Math.min(window.innerWidth - 100, e.clientX - iconDragOffset.x));
    icon.y = Math.max(50, Math.min(window.innerHeight - 150, e.clientY - iconDragOffset.y));
    
    const el = document.getElementById(`desktop-icon-${draggedIconId}`);
    el.style.left = icon.x + 'px';
    el.style.top = icon.y + 'px';
}

function handleIconMouseUp(e) {
    if (draggedIconId) {
        document.getElementById(`desktop-icon-${draggedIconId}`).classList.remove('dragging');
        draggedIconId = null;
        saveState();
    }
    document.removeEventListener('mousemove', handleIconMouseMove);
    document.removeEventListener('mouseup', handleIconMouseUp);
}

// Touch handling for icons
function handleIconTouchStart(e, iconId) {
    e.stopPropagation();
    iconTouchStartTime = Date.now();
    iconTouchMoved = false;
    
    const touch = e.touches[0];
    const icon = desktopIcons.find(i => i.id === iconId);
    iconDragOffset.x = touch.clientX - icon.x;
    iconDragOffset.y = touch.clientY - icon.y;
    draggedIconId = iconId;
}

function handleIconTouchMove(e) {
    if (!draggedIconId) return;
    e.preventDefault();
    iconTouchMoved = true;
    
    const touch = e.touches[0];
    const icon = desktopIcons.find(i => i.id === draggedIconId);
    icon.x = Math.max(0, Math.min(window.innerWidth - 100, touch.clientX - iconDragOffset.x));
    icon.y = Math.max(50, Math.min(window.innerHeight - 150, touch.clientY - iconDragOffset.y));
    
    const el = document.getElementById(`desktop-icon-${draggedIconId}`);
    el.style.left = icon.x + 'px';
    el.style.top = icon.y + 'px';
}

function handleIconTouchEnd(e) {
    if (draggedIconId) {
        const touchDuration = Date.now() - iconTouchStartTime;
        
        // If it was a tap (not drag), treat as click
        if (!iconTouchMoved && touchDuration < 300) {
            handleIconDoubleClick(e, draggedIconId);
        }
        
        draggedIconId = null;
        saveState();
    }
}

function handleIconClick(e, iconId) {
    // Single click just selects
    document.querySelectorAll('.desktop-icon').forEach(el => el.classList.remove('selected'));
    document.getElementById(`desktop-icon-${iconId}`).classList.add('selected');
}

function handleIconDoubleClick(e, iconId) {
    e.stopPropagation();
    const icon = desktopIcons.find(i => i.id === iconId);
    
    if (icon.isTrash) {
        openApp('trash');
    } else if (icon.path) {
        openApp('files', icon.path);
    }
}

function showIconContextMenu(e, iconId) {
    e.preventDefault();
    e.stopPropagation();
    
    const icon = desktopIcons.find(i => i.id === iconId);
    
    showContextMenu(e.clientX, e.clientY, [
        { label: 'Open', icon: 'fa-folder-open', action: () => handleIconDoubleClick(e, iconId) },
        { label: icon.isTrash ? 'Empty Trash' : 'Rename', icon: 'fa-edit', action: () => renameDesktopIcon(iconId) },
        !icon.isTrash && { label: 'Delete', icon: 'fa-trash', action: () => deleteDesktopIcon(iconId) }
    ].filter(Boolean));
}

function renameDesktopIcon(iconId) {
    const icon = desktopIcons.find(i => i.id === iconId);
    const newName = prompt('New name:', icon.name);
    if (newName) {
        icon.name = newName;
        renderDesktopIcons();
        saveState();
    }
}

function deleteDesktopIcon(iconId) {
    const index = desktopIcons.findIndex(i => i.id === iconId);
    if (index > -1) {
        desktopIcons.splice(index, 1);
        renderDesktopIcons();
        saveState();
        showNotification('Desktop', 'Icon removed', 'fa-trash');
    }
}

// File System Operations
function getFolder(path) {
    let current = fileSystem.root;
    for (const segment of path) {
        if (current.children && current.children[segment]) {
            current = current.children[segment];
        } else {
            return null;
        }
    }
    return current;
}

function createFile(path, name, content = '') {
    const folder = getFolder(path);
    if (folder && folder.children) {
        folder.children[name] = {
            type: 'file',
            content: content,
            lastModified: Date.now()
        };
        saveState();
        return true;
    }
    return false;
}

function createFolder(path, name) {
    const folder = getFolder(path);
    if (folder && folder.children) {
        folder.children[name] = {
            type: 'folder',
            children: {}
        };
        saveState();
        return true;
    }
    return false;
}

function moveToTrash(path, name) {
    const folder = getFolder(path);
    if (folder && folder.children && folder.children[name]) {
        fileSystem.trash[name + '_' + Date.now()] = folder.children[name];
        delete folder.children[name];
        saveState();
        return true;
    }
    return false;
}

function restoreFromTrash(name) {
    if (fileSystem.trash[name]) {
        fileSystem.root.children['Home'].children[name] = fileSystem.trash[name];
        delete fileSystem.trash[name];
        saveState();
        return true;
    }
    return false;
}

function emptyTrash() {
    fileSystem.trash = {};
    saveState();
    showNotification('Trash', 'Trash emptied', 'fa-trash');
}

// Export/Import
function exportFileSystem() {
    const data = JSON.stringify(fileSystem, null, 2);
    downloadFile('filesystem.json', data, 'application/json');
    showNotification('Export', 'File system exported', 'fa-download');
}

function importFileSystem() {
    document.getElementById('fs-import-input').click();
}

function handleFSImport(input) {
    const file = input.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                fileSystem = JSON.parse(e.target.result);
                saveState();
                showNotification('Import', 'File system imported successfully', 'fa-check');
                state.windows.forEach(w => {
                    if (w.app.id === 'files') refreshFileWindow(w.id);
                });
            } catch (err) {
                showNotification('Error', 'Invalid file system format', 'fa-exclamation');
            }
        };
        reader.readAsText(file);
    }
}

function exportQuickLinks() {
    const data = JSON.stringify(quickLinks, null, 2);
    downloadFile('quicklinks.json', data, 'application/json');
    showNotification('Export', 'Quick links exported', 'fa-download');
}

function importQuickLinks() {
    document.getElementById('ql-import-input').click();
}

function handleQLImport(input) {
    const file = input.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                quickLinks = JSON.parse(e.target.result);
                saveState();
                renderQuickLinks();
                showNotification('Import', 'Quick links imported successfully', 'fa-check');
            } catch (err) {
                showNotification('Error', 'Invalid quick links format', 'fa-exclamation');
            }
        };
        reader.readAsText(file);
    }
}

function downloadFile(filename, content, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

// Apps
function renderApps(filter = '') {
    const filtered = apps.filter(app => app.name.toLowerCase().includes(filter.toLowerCase()));
    els.appsGrid.innerHTML = filtered.map(app => `
        <button onclick="openApp('${app.id}'); toggleLauncher()" 
                class="hypr-card rounded-xl p-3 flex flex-col items-center gap-2 hover:scale-105 transition-transform group">
            <div class="w-12 h-12 rounded-lg bg-hypr-surface flex items-center justify-center ${app.color} group-hover:brightness-125">
                <i class="fas ${app.icon} text-xl"></i>
            </div>
            <span class="text-xs text-center text-hypr-muted group-hover:text-hypr-text">${app.name}</span>
        </button>
    `).join('');
}

function renderQuickLinks() {
    els.quickLinksList.innerHTML = quickLinks.map((link, i) => `
        <div class="quick-link group" onclick="openURL('${link.url}')">
            <i class="fab ${link.icon} ${link.color} w-5"></i>
            <span class="text-sm flex-1">${link.name}</span>
            <button onclick="event.stopPropagation(); editQuickLink(${i})" class="text-hypr-muted hover:text-hypr-text opacity-0 group-hover:opacity-100">
                <i class="fas fa-edit text-xs"></i>
            </button>
        </div>
    `).join('');
}

function manageQuickLinks() {
    const name = prompt('Link name:');
    if (!name) return;
    const url = prompt('URL:');
    if (!url) return;
    const icon = prompt('FontAwesome icon class (e.g., fa-google):', 'fa-link') || 'fa-link';
    const color = prompt('Color class (e.g., text-blue-400):', 'text-hypr-accent') || 'text-hypr-accent';
    
    quickLinks.push({ name, url, icon, color });
    saveState();
    renderQuickLinks();
    showNotification('Quick Links', 'Link added', 'fa-plus');
}

function editQuickLink(index) {
    const link = quickLinks[index];
    const action = prompt('Action: (delete/edit)', 'edit');
    if (action === 'delete') {
        quickLinks.splice(index, 1);
        saveState();
        renderQuickLinks();
    } else if (action === 'edit') {
        link.name = prompt('Name:', link.name) || link.name;
        link.url = prompt('URL:', link.url) || link.url;
        saveState();
        renderQuickLinks();
    }
}

function openURL(url) {
    if (!url.startsWith('http')) url = 'https://' + url;
    window.open(url, '_blank');
}

function getRandomPosition() {
    const maxX = Math.max(50, window.innerWidth - 850);
    const maxY = Math.max(100, window.innerHeight - 650);
    return {
        x: Math.floor(Math.random() * maxX) + 50,
        y: Math.floor(Math.random() * maxY) + 80
    };
}

function openApp(appId, path = null) {
    const app = apps.find(a => a.id === appId) || { id: appId, name: appId, icon: 'fa-window-maximize', color: 'text-hypr-text' };
    const windowId = 'win-' + Date.now();
    const pos = getRandomPosition();
    
    const windowEl = document.createElement('div');
    windowEl.id = windowId;
    windowEl.className = 'absolute hypr-blur rounded-xl flex flex-col shadow-2xl window-anim pointer-events-auto';
    windowEl.style.width = '800px';
    windowEl.style.height = '600px';
    windowEl.style.left = pos.x + 'px';
    windowEl.style.top = pos.y + 'px';
    if (state.glow) windowEl.classList.add('active-glow');

    let content = generateAppContent(appId, windowId, path);

    windowEl.innerHTML = `
        <div class="h-10 border-b border-white/10 flex items-center justify-between px-3 bg-white/5 rounded-t-xl touch-none" 
             onmousedown="startDrag(event, '${windowId}')" 
             ontouchstart="startDrag(event, '${windowId}')">
            <div class="flex items-center gap-2 pointer-events-none">
                <i class="fas ${app.icon} ${app.color} text-xs"></i>
                <span class="text-xs font-mono text-hypr-muted" id="title-${windowId}">${app.name}</span>
            </div>
            <div class="flex items-center gap-2">
                <button onclick="minimizeWindow('${windowId}')" class="w-3 h-3 rounded-full bg-yellow-500/80 hover:bg-yellow-400 transition-colors"></button>
                <button onclick="maximizeWindow('${windowId}')" class="w-3 h-3 rounded-full bg-green-500/80 hover:bg-green-400 transition-colors"></button>
                <button onclick="closeWindow('${windowId}')" class="w-3 h-3 rounded-full bg-red-500/80 hover:bg-red-400 transition-colors"></button>
            </div>
        </div>
        <div class="flex-1 overflow-hidden rounded-b-xl relative" id="content-${windowId}">
            ${content}
        </div>
    `;

    els.windowsContainer.appendChild(windowEl);
    state.windows.push({ id: windowId, element: windowEl, app, path });
    focusWindow(windowId);
    showNotification('Launched', `${app.name} is now running`, app.icon, app.color);
}

function generateAppContent(appId, windowId, path) {
    switch(appId) {
        case 'terminal':
            return `
                <div class="p-4 font-mono text-sm h-full overflow-auto bg-hypr-bg/80" id="term-${windowId}">
                    <div class="text-green-400 mb-2">user@hypr-os ~ $ neofetch</div>
                    <div class="text-hypr-text mb-4 font-mono text-xs leading-relaxed opacity-80">
                        <span class="text-hypr-accent">  OS:</span> HyprOS Web Edition<br>
                        <span class="text-hypr-accent">  Host:</span> ${navigator.platform}<br>
                        <span class="text-hypr-accent">  Browser:</span> ${navigator.userAgent.split(')')[0].split('(')[1] || 'Unknown'}<br>
                        <span class="text-hypr-accent">  Memory:</span> ${navigator.deviceMemory || '?'}GB<br>
                        <span class="text-hypr-accent">  Cores:</span> ${navigator.hardwareConcurrency || '?'}<br>
                        <span class="text-hypr-accent">  Online:</span> ${navigator.onLine ? 'Yes' : 'No'}<br>
                    </div>
                    <div class="text-green-400 flex items-center gap-2">
                        user@hypr-os ~ $ 
                        <input type="text" class="bg-transparent border-none outline-none text-hypr-text flex-1 font-mono" 
                               onkeydown="handleTerminal(event, '${windowId}')" 
                               placeholder="type 'help' for commands" autocomplete="off" id="input-${windowId}">
                    </div>
                </div>`;
        
        case 'files':
            const initialPath = path || ['Home'];
            return `
                <div class="flex h-full text-sm">
                    <div class="w-48 border-r border-white/10 p-2 space-y-1 overflow-auto bg-hypr-surface/30">
                        <div class="text-xs font-bold text-hypr-muted uppercase mb-2 p-2">Locations</div>
                        <div class="file-item selected" onclick="navigateTo('${windowId}', ['Home'])">
                            <i class="fas fa-home text-hypr-accent"></i> Home
                        </div>
                        <div class="file-item" onclick="navigateTo('${windowId}', ['Home', 'Documents'])">
                            <i class="fas fa-file-alt text-blue-400"></i> Documents
                        </div>
                        <div class="file-item" onclick="navigateTo('${windowId}', ['Home', 'Pictures'])">
                            <i class="fas fa-image text-purple-400"></i> Pictures
                        </div>
                        <div class="file-item" onclick="navigateTo('${windowId}', ['Home', 'Music'])">
                            <i class="fas fa-music text-pink-400"></i> Music
                        </div>
                        <div class="file-item" onclick="navigateTo('${windowId}', ['Home', 'Downloads'])">
                            <i class="fas fa-download text-green-400"></i> Downloads
                        </div>
                        <div class="mt-4 pt-4 border-t border-white/10">
                            <div class="file-item" onclick="openApp('trash')">
                                <i class="fas fa-trash text-gray-400"></i> Trash
                            </div>
                        </div>
                    </div>
                    <div class="flex-1 flex flex-col">
                        <div class="h-10 border-b border-white/10 flex items-center justify-between px-4 bg-white/5">
                            <div class="flex items-center gap-2 text-xs" id="breadcrumb-${windowId}">
                                ${initialPath.join(' / ')}
                            </div>
                            <div class="flex gap-2">
                                <button onclick="createNewFile('${windowId}')" class="text-xs bg-hypr-accent/20 text-hypr-accent px-3 py-1 rounded hover:bg-hypr-accent/30">
                                    <i class="fas fa-file mr-1"></i> New File
                                </button>
                                <button onclick="createNewFolder('${windowId}')" class="text-xs bg-hypr-surface text-hypr-text px-3 py-1 rounded hover:bg-white/10">
                                    <i class="fas fa-folder mr-1"></i> New Folder
                                </button>
                            </div>
                        </div>
                        <div class="flex-1 p-4 overflow-auto" id="files-area-${windowId}" oncontextmenu="showFilesContextMenu(event, '${windowId}')">
                            ${renderFileGrid(initialPath, windowId)}
                        </div>
                    </div>
                </div>`;
        
        case 'trash':
            return `
                <div class="flex flex-col h-full">
                    <div class="h-10 border-b border-white/10 flex items-center justify-between px-4 bg-white/5">
                        <span class="text-sm font-bold">Trash</span>
                        <button onclick="emptyTrash()" class="text-xs bg-hypr-error/20 text-hypr-error px-3 py-1 rounded hover:bg-hypr-error/30">
                            <i class="fas fa-trash-alt mr-1"></i> Empty Trash
                        </button>
                    </div>
                    <div class="flex-1 p-4 overflow-auto" id="trash-area-${windowId}">
                        ${renderTrash()}
                    </div>
                </div>`;
        
        case 'browser':
            return `
                <div class="flex flex-col h-full">
                    <div class="flex items-center gap-2 p-2 border-b border-white/10 bg-hypr-surface/30">
                        <div class="flex gap-1">
                            <button onclick="browserBack('${windowId}')" class="w-8 h-8 rounded hover:bg-white/10 flex items-center justify-center"><i class="fas fa-arrow-left"></i></button>
                            <button onclick="browserForward('${windowId}')" class="w-8 h-8 rounded hover:bg-white/10 flex items-center justify-center"><i class="fas fa-arrow-right"></i></button>
                            <button onclick="browserReload('${windowId}')" class="w-8 h-8 rounded hover:bg-white/10 flex items-center justify-center"><i class="fas fa-rotate-right"></i></button>
                        </div>
                        <div class="flex-1 bg-hypr-bg rounded-lg px-3 py-2 text-sm flex items-center gap-2 border border-hypr-border focus-within:border-hypr-accent">
                            <i class="fas fa-lock text-hypr-success text-xs"></i>
                            <input type="text" id="url-${windowId}" class="bg-transparent border-none outline-none text-hypr-text flex-1" 
                                   value="https://example.com" onkeydown="if(event.key==='Enter')navigateBrowser('${windowId}')">
                        </div>
                        <button onclick="navigateBrowser('${windowId}')" class="w-8 h-8 rounded hover:bg-white/10 flex items-center justify-center">
                            <i class="fas fa-arrow-right"></i>
                        </button>
                    </div>
                    <iframe id="iframe-${windowId}" src="https://example.com" class="flex-1 bg-white" sandbox="allow-same-origin allow-scripts allow-popups allow-forms"></iframe>
                </div>`;
        
        case 'code':
            return `
                <div class="flex h-full text-sm font-mono">
                    <div class="w-48 border-r border-white/10 p-2 space-y-1 overflow-auto bg-hypr-surface/30">
                        <div class="flex items-center gap-2 p-2 rounded bg-hypr-accent/20 text-hypr-accent cursor-pointer">
                            <i class="fas fa-file-code"></i> untitled.txt
                        </div>
                    </div>
                    <div class="flex-1 flex flex-col">
                        <div class="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-white/5">
                            <span class="text-xs text-hypr-muted">untitled.txt</span>
                            <div class="flex gap-2">
                                <button onclick="saveTextFile('${windowId}')" class="text-xs bg-hypr-accent/20 text-hypr-accent px-3 py-1 rounded hover:bg-hypr-accent/30">
                                    <i class="fas fa-save mr-1"></i> Save
                                </button>
                                <button onclick="openTextFile('${windowId}')" class="text-xs bg-hypr-surface px-3 py-1 rounded hover:bg-white/10">
                                    <i class="fas fa-folder-open mr-1"></i> Open
                                </button>
                            </div>
                        </div>
                        <textarea id="editor-${windowId}" class="flex-1 bg-hypr-bg/50 p-4 resize-none outline-none text-hypr-text font-mono text-sm" 
                                  placeholder="Start typing..."></textarea>
                        <input type="file" id="file-open-${windowId}" class="hidden" accept=".txt,.md,.js,.py,.html,.css" onchange="handleTextFileOpen(this, '${windowId}')">
                    </div>
                </div>`;
        
        case 'music':
            return `
                <div class="flex h-full">
                    <div class="w-64 border-r border-white/10 p-4 space-y-4 overflow-auto">
                        <div class="border-2 border-dashed border-hypr-border rounded-lg p-4 text-center hover:border-hypr-accent transition-colors cursor-pointer relative">
                            <input type="file" id="music-upload-${windowId}" accept="audio/*" multiple 
                                   class="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onchange="handleMusicUpload(this, '${windowId}')">
                            <i class="fas fa-plus text-hypr-accent text-2xl mb-2"></i>
                            <p class="text-xs text-hypr-muted">Add music files</p>
                        </div>
                        <div class="text-xs font-bold text-hypr-muted uppercase">Library</div>
                        <div class="space-y-1" id="playlist-${windowId}"></div>
                    </div>
                    <div class="flex-1 flex flex-col p-6">
                        <div class="flex-1 flex items-center justify-center">
                            <div class="text-center">
                                <div class="w-48 h-48 rounded-2xl bg-gradient-to-br from-hypr-accent to-hypr-accent2 flex items-center justify-center mb-6 shadow-2xl" id="album-art-${windowId}">
                                    <i class="fas fa-music text-6xl text-white"></i>
                                </div>
                                <h2 class="text-2xl font-bold mb-1" id="track-title-${windowId}">No track</h2>
                                <p class="text-hypr-muted" id="track-artist-${windowId}">Add music to play</p>
                            </div>
                        </div>
                        <div class="space-y-4">
                            <div class="audio-visualizer justify-center" id="visualizer-${windowId}">
                                ${Array(20).fill(0).map(() => `<div class="audio-bar" style="height: 4px"></div>`).join('')}
                            </div>
                            <div class="flex items-center justify-center gap-6">
                                <button onclick="prevTrack('${windowId}')" class="text-hypr-muted hover:text-hypr-text"><i class="fas fa-step-backward text-xl"></i></button>
                                <button onclick="toggleMusic('${windowId}')" id="play-btn-${windowId}" class="w-14 h-14 rounded-full bg-hypr-accent text-hypr-bg flex items-center justify-center hover:scale-110">
                                    <i class="fas fa-play text-xl ml-1"></i>
                                </button>
                                <button onclick="nextTrack('${windowId}')" class="text-hypr-muted hover:text-hypr-text"><i class="fas fa-step-forward text-xl"></i></button>
                            </div>
                            <div class="flex items-center gap-3">
                                <span class="text-xs text-hypr-muted w-10 text-right" id="current-time-${windowId}">0:00</span>
                                <div class="flex-1 h-1 bg-white/10 rounded-full overflow-hidden cursor-pointer" onclick="seekMusic(event, '${windowId}')">
                                    <div id="progress-${windowId}" class="h-full bg-hypr-accent w-0"></div>
                                </div>
                                <span class="text-xs text-hypr-muted w-10" id="duration-${windowId}">0:00</span>
                            </div>
                        </div>
                    </div>
                </div>
                <audio id="audio-${windowId}" crossorigin="anonymous"></audio>`;
        
        case 'calculator':
            return `
                <div class="p-6 h-full flex flex-col">
                    <div class="flex-1 flex items-end justify-end p-4 text-5xl font-mono text-hypr-text mb-4 bg-hypr-surface/30 rounded-lg break-all" id="calc-display-${windowId}">0</div>
                    <div class="grid grid-cols-4 gap-3">
                        ${['C', '±', '%', '÷', '7', '8', '9', '×', '4', '5', '6', '-', '1', '2', '3', '+', '0', '.', '='].map(btn => {
                            const isOp = ['÷', '×', '-', '+', '='].includes(btn);
                            const isFn = ['C', '±', '%'].includes(btn);
                            const span = btn === '0' ? 'col-span-2' : '';
                            const color = isOp ? 'bg-hypr-accent text-hypr-bg' : isFn ? 'bg-hypr-surface text-hypr-text' : 'bg-hypr-surface/50 text-hypr-text';
                            return `<button onclick="calcInput('${btn}', '${windowId}')" class="${span} ${color} h-14 rounded-lg font-bold hover:brightness-110 transition-all text-lg">${btn}</button>`;
                        }).join('')}
                    </div>
                </div>`;
        
        case 'paint':
            return `
                <div class="flex flex-col h-full">
                    <div class="h-12 border-b border-white/10 flex items-center gap-2 px-4 bg-white/5">
                        <button onclick="clearCanvas('${windowId}')" class="p-2 rounded hover:bg-white/10" title="Clear"><i class="fas fa-trash"></i></button>
                        <div class="w-px h-6 bg-white/10 mx-2"></div>
                        <input type="color" id="color-${windowId}" value="#cba6f7" class="w-8 h-8 rounded cursor-pointer bg-transparent border-none">
                        <input type="range" id="brush-${windowId}" min="1" max="50" value="5" class="w-24">
                        <div class="flex-1"></div>
                        <button onclick="saveCanvas('${windowId}')" class="px-3 py-1 bg-hypr-accent/20 text-hypr-accent rounded hover:bg-hypr-accent/30 text-sm">
                            <i class="fas fa-download mr-1"></i> Save
                        </button>
                    </div>
                    <div class="flex-1 relative overflow-hidden bg-white">
                        <canvas id="canvas-${windowId}" class="absolute inset-0 cursor-crosshair touch-none"></canvas>
                    </div>
                </div>`;
        
        default:
            return `<div class="p-8 text-center"><i class="fas fa-cube text-6xl text-hypr-muted mb-4"></i><p>Application "${appId}"</p></div>`;
    }
}

// File Manager Functions
function renderFileGrid(path, windowId) {
    const folder = getFolder(path);
    if (!folder || !folder.children) return '<div class="text-hypr-muted">Empty folder</div>';
    
    const entries = Object.entries(folder.children);
    if (entries.length === 0) return '<div class="text-hypr-muted text-center mt-8">Empty folder</div>';
    
    return entries.map(([name, item]) => `
        <div class="file-item p-3 rounded-lg hover:bg-white/5 cursor-pointer group" 
             onclick="handleFileClick('${windowId}', '${name}', '${item.type}')"
             oncontextmenu="showFileContextMenu(event, '${windowId}', '${name}')">
            <i class="fas ${item.type === 'folder' ? 'fa-folder text-yellow-400' : getFileIcon(name)} text-2xl w-10"></i>
            <div class="flex-1 min-w-0">
                <div class="text-sm truncate">${name}</div>
                <div class="text-xs text-hypr-muted">${item.type === 'folder' ? 'Folder' : formatFileSize(item.content)} • ${new Date(item.lastModified).toLocaleDateString()}</div>
            </div>
            ${item.type === 'file' ? `<button onclick="event.stopPropagation(); openFileInEditor('${windowId}', '${name}')" class="opacity-0 group-hover:opacity-100 text-hypr-muted hover:text-hypr-accent"><i class="fas fa-edit"></i></button>` : ''}
        </div>
    `).join('');
}

function getFileIcon(filename) {
    if (filename.endsWith('.txt') || filename.endsWith('.md')) return 'fa-file-alt text-gray-400';
    if (filename.endsWith('.js') || filename.endsWith('.py') || filename.endsWith('.html')) return 'fa-file-code text-blue-400';
    if (filename.endsWith('.json')) return 'fa-file-code text-yellow-400';
    if (filename.endsWith('.png') || filename.endsWith('.jpg')) return 'fa-image text-purple-400';
    return 'fa-file text-gray-400';
}

function formatFileSize(content) {
    const bytes = new Blob([content]).size;
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function handleFileClick(windowId, name, type) {
    const win = state.windows.find(w => w.id === windowId);
    if (type === 'folder') {
        win.path.push(name);
        refreshFileWindow(windowId);
    } else {
        openFileInEditor(windowId, name);
    }
}

function navigateTo(windowId, path) {
    const win = state.windows.find(w => w.id === windowId);
    win.path = path;
    refreshFileWindow(windowId);
}

function refreshFileWindow(windowId) {
    const win = state.windows.find(w => w.id === windowId);
    document.getElementById(`breadcrumb-${windowId}`).textContent = win.path.join(' / ');
    document.getElementById(`files-area-${windowId}`).innerHTML = renderFileGrid(win.path, windowId);
}

function createNewFile(windowId) {
    const name = prompt('File name:');
    if (name) {
        const win = state.windows.find(w => w.id === windowId);
        if (createFile(win.path, name, '')) {
            refreshFileWindow(windowId);
            showNotification('Files', `Created ${name}`, 'fa-file');
        }
    }
}

function createNewFolder(windowId) {
    const name = prompt('Folder name:');
    if (name) {
        const win = state.windows.find(w => w.id === windowId);
        if (createFolder(win.path, name)) {
            refreshFileWindow(windowId);
            showNotification('Files', `Created ${name}`, 'fa-folder');
        }
    }
}

function openFileInEditor(windowId, filename) {
    const win = state.windows.find(w => w.id === windowId);
    const folder = getFolder(win.path);
    const file = folder.children[filename];
    if (file && file.type === 'file') {
        openApp('code');
        setTimeout(() => {
            const editorWin = state.windows[state.windows.length - 1];
            if (editorWin && editorWin.app.id === 'code') {
                document.getElementById(`editor-${editorWin.id}`).value = file.content;
                document.getElementById(`title-${editorWin.id}`).textContent = filename;
                editorWin.editingFile = { path: win.path, name: filename };
            }
        }, 100);
    }
}

function renderTrash() {
    const entries = Object.entries(fileSystem.trash);
    if (entries.length === 0) return '<div class="text-hypr-muted text-center mt-8">Trash is empty</div>';
    
    return entries.map(([name, item]) => `
        <div class="file-item p-3 rounded-lg hover:bg-white/5 cursor-pointer">
            <i class="fas ${item.type === 'folder' ? 'fa-folder text-yellow-400' : 'fa-file text-gray-400'} text-2xl w-10"></i>
            <div class="flex-1 min-w-0">
                <div class="text-sm truncate">${name.split('_')[0]}</div>
                <div class="text-xs text-hypr-muted">${item.type} • Deleted</div>
            </div>
            <button onclick="restoreFromTrash('${name}')" class="text-hypr-success hover:text-hypr-accent mr-2" title="Restore">
                <i class="fas fa-undo"></i>
            </button>
            <button onclick="permanentDelete('${name}')" class="text-hypr-error hover:text-red-400" title="Delete Forever">
                <i class="fas fa-trash-alt"></i>
            </button>
        </div>
    `).join('');
}

function permanentDelete(name) {
    delete fileSystem.trash[name];
    saveState();
    state.windows.forEach(w => {
        if (w.app.id === 'trash') {
            document.getElementById(`trash-area-${w.id}`).innerHTML = renderTrash();
        }
    });
    showNotification('Trash', 'File permanently deleted', 'fa-trash');
}

// Context Menus
function showContextMenu(x, y, items) {
    const menu = els.contextMenu;
    menu.innerHTML = items.map(item => `
        <div class="context-menu-item" onclick="${item.action}(); hideContextMenu()">
            <i class="fas ${item.icon} w-4"></i>
            ${item.label}
        </div>
    `).join('');
    menu.style.left = Math.min(x, window.innerWidth - 180) + 'px';
    menu.style.top = Math.min(y, window.innerHeight - 200) + 'px';
    menu.classList.remove('hidden');
}

function hideContextMenu() {
    els.contextMenu.classList.add('hidden');
}

function showFilesContextMenu(e, windowId) {
    e.preventDefault();
    showContextMenu(e.clientX, e.clientY, [
        { label: 'New File', icon: 'fa-file', action: () => createNewFile(windowId) },
        { label: 'New Folder', icon: 'fa-folder', action: () => createNewFolder(windowId) },
        { label: 'Refresh', icon: 'fa-rotate-right', action: () => refreshFileWindow(windowId) }
    ]);
}

function showFileContextMenu(e, windowId, filename) {
    e.preventDefault();
    e.stopPropagation();
    showContextMenu(e.clientX, e.clientY, [
        { label: 'Open', icon: 'fa-folder-open', action: () => handleFileClick(windowId, filename, 'file') },
        { label: 'Rename', icon: 'fa-edit', action: () => renameFile(windowId, filename) },
        { label: 'Delete', icon: 'fa-trash', action: () => deleteFileFromWindow(windowId, filename) }
    ]);
}

function renameFile(windowId, oldName) {
    const newName = prompt('New name:', oldName);
    if (newName && newName !== oldName) {
        const win = state.windows.find(w => w.id === windowId);
        const folder = getFolder(win.path);
        folder.children[newName] = folder.children[oldName];
        folder.children[newName].lastModified = Date.now();
        delete folder.children[oldName];
        saveState();
        refreshFileWindow(windowId);
    }
}

function deleteFileFromWindow(windowId, filename) {
    const win = state.windows.find(w => w.id === windowId);
    if (moveToTrash(win.path, filename)) {
        refreshFileWindow(windowId);
        showNotification('Files', 'Moved to trash', 'fa-trash');
    }
}

// Text Editor Functions
function saveTextFile(windowId) {
    const win = state.windows.find(w => w.id === windowId);
    const content = document.getElementById(`editor-${windowId}`).value;
    
    if (win.editingFile) {
        const folder = getFolder(win.editingFile.path);
        folder.children[win.editingFile.name].content = content;
        folder.children[win.editingFile.name].lastModified = Date.now();
        saveState();
        showNotification('Editor', 'File saved', 'fa-save');
    } else {
        const name = prompt('Save as:', 'untitled.txt');
        if (name) {
            createFile(['Home', 'Documents'], name, content);
            showNotification('Editor', `Saved as ${name}`, 'fa-save');
        }
    }
}

function openTextFile(windowId) {
    document.getElementById(`file-open-${windowId}`).click();
}

function handleTextFileOpen(input, windowId) {
    const file = input.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById(`editor-${windowId}`).value = e.target.result;
            document.getElementById(`title-${windowId}`).textContent = file.name;
        };
        reader.readAsText(file);
    }
}

// Terminal Functions
const commandHistory = {};

function handleTerminal(e, windowId) {
    if (e.key === 'Enter') {
        const input = e.target;
        const cmd = input.value.trim();
        const term = document.getElementById('term-' + windowId);
        
        if (!commandHistory[windowId]) commandHistory[windowId] = [];
        commandHistory[windowId].push(cmd);
        
        const line = document.createElement('div');
        line.className = 'text-green-400 mb-1';
        line.innerHTML = `user@hypr-os ~ $ <span class="text-hypr-text">${cmd}</span>`;
        term.insertBefore(line, term.lastElementChild);
        
        let output = processCommand(cmd, windowId);
        
        if (output) {
            const outLine = document.createElement('div');
            outLine.className = 'text-hypr-text mb-2 whitespace-pre-wrap';
            outLine.textContent = output;
            term.insertBefore(outLine, term.lastElementLast);
        }
        
        input.value = '';
        term.scrollTop = term.scrollHeight;
    }
}

function processCommand(cmd, windowId) {
    const parts = cmd.split(' ');
    const command = parts[0];
    const args = parts.slice(1);
    
    switch(command) {
        case 'help':
            return `Available commands:
help, clear, ls, pwd, cd, mkdir, touch, rm, cat, echo, neofetch
open <app>, edit <file>, date, whoami, uname, export, import`;
        
        case 'clear':
            const term = document.getElementById('term-' + windowId);
            term.innerHTML = `
                <div class="text-green-400 flex items-center gap-2">
                    user@hypr-os ~ $ 
                    <input type="text" class="bg-transparent border-none outline-none text-hypr-text flex-1 font-mono" 
                           onkeydown="handleTerminal(event, '${windowId}')" autocomplete="off">
                </div>`;
            term.querySelector('input').focus();
            return null;
        
        case 'ls':
            const win = state.windows.find(w => w.id === windowId);
            const folder = getFolder(win?.path || ['Home']);
            if (folder && folder.children) {
                return Object.entries(folder.children).map(([name, item]) => {
                    const prefix = item.type === 'folder' ? 'd' : '-';
                    const size = item.type === 'file' ? new Blob([item.content]).size : '-';
                    const date = new Date(item.lastModified).toLocaleDateString();
                    return `${prefix}rwxrwxrwx user user ${size.toString().padStart(8)} ${date} ${name}`;
                }).join('\n');
            }
            return '';
        
        case 'pwd':
            const w = state.windows.find(w => w.id === windowId);
            return '/' + (w?.path || ['Home']).join('/');
        
        case 'cd':
            return 'Use the file manager for navigation';
        
        case 'mkdir':
            if (args[0]) {
                const win = state.windows.find(w => w.id === windowId);
                createFolder(win?.path || ['Home'], args[0]);
                return `Created directory: ${args[0]}`;
            }
            return 'Usage: mkdir <name>';
        
        case 'touch':
            if (args[0]) {
                const win = state.windows.find(w => w.id === windowId);
                createFile(win?.path || ['Home'], args[0], '');
                return `Created file: ${args[0]}`;
            }
            return 'Usage: touch <name>';
        
        case 'rm':
            if (args[0]) {
                const win = state.windows.find(w => w.id === windowId);
                moveToTrash(win?.path || ['Home'], args[0]);
                return `Moved to trash: ${args[0]}`;
            }
            return 'Usage: rm <name>';
        
        case 'cat':
            if (args[0]) {
                const win = state.windows.find(w => w.id === windowId);
                const f = getFolder(win?.path || ['Home']);
                if (f.children[args[0]] && f.children[args[0]].type === 'file') {
                    return f.children[args[0]].content;
                }
                return `File not found: ${args[0]}`;
            }
            return 'Usage: cat <filename>';
        
        case 'echo':
            return args.join(' ');
        
        case 'neofetch':
            return `OS: HyprOS Web Edition
Host: ${navigator.platform}
Kernel: Browser Engine
Uptime: ${Math.floor(performance.now() / 1000 / 60)} mins
Packages: ${Object.keys(fileSystem.root.children).length}
Shell: zsh
Resolution: ${window.innerWidth}x${window.innerHeight}
DE: Hyprland
WM: Tiling
Theme: Catppuccin
Icons: FontAwesome
Terminal: kitty
CPU: ${navigator.hardwareConcurrency || '?'} cores
Memory: ${navigator.deviceMemory || '?'} GB`;
        
        case 'open':
            if (args[0]) {
                openApp(args[0]);
                return `Opening ${args[0]}...`;
            }
            return 'Usage: open <app>';
        
        case 'date':
            return new Date().toString();
        
        case 'whoami':
            return 'user';
        
        case 'uname':
            return 'HyprOS Web';
        
        case 'export':
            exportFileSystem();
            return 'Exporting file system...';
        
        case 'import':
            importFileSystem();
            return 'Select file to import...';
        
        case '':
            return '';
        
        default:
            return `Command not found: ${command}. Type 'help' for available commands.`;
    }
}

// Browser Functions
function navigateBrowser(windowId) {
    const url = document.getElementById(`url-${windowId}`).value;
    const iframe = document.getElementById(`iframe-${windowId}`);
    let finalUrl = url;
    if (!url.startsWith('http')) finalUrl = 'https://' + url;
    iframe.src = finalUrl;
}

function browserBack(windowId) {
    try {
        document.getElementById(`iframe-${windowId}`).contentWindow.history.back();
    } catch(e) {}
}

function browserForward(windowId) {
    try {
        document.getElementById(`iframe-${windowId}`).contentWindow.history.forward();
    } catch(e) {}
}

function browserReload(windowId) {
    const iframe = document.getElementById(`iframe-${windowId}`);
    iframe.src = iframe.src;
}

// Music Functions
let audioPlayers = {};

function handleMusicUpload(input, windowId) {
    const files = Array.from(input.files);
    files.forEach(file => {
        const url = URL.createObjectURL(file);
        state.musicFiles.push({
            name: file.name.replace(/\.[^/.]+$/, ""),
            artist: "Unknown",
            url: url,
            file: file
        });
    });
    updatePlaylist(windowId);
    showNotification('Music', `Added ${files.length} tracks`, 'fa-music');
}

function updatePlaylist(windowId) {
    const playlist = document.getElementById(`playlist-${windowId}`);
    if (state.musicFiles.length === 0) {
        playlist.innerHTML = '<div class="text-xs text-hypr-muted p-2">No tracks</div>';
        return;
    }
    playlist.innerHTML = state.musicFiles.map((track, i) => `
        <div class="flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 cursor-pointer ${audioPlayers[windowId]?.currentTrack === i ? 'bg-hypr-accent/20 text-hypr-accent' : 'text-hypr-muted'}" 
             onclick="loadTrack(${i}, '${windowId}')">
            <i class="fas fa-music text-xs"></i>
            <div class="flex-1 min-w-0">
                <div class="text-xs truncate">${track.name}</div>
            </div>
        </div>
    `).join('');
}

function loadTrack(index, windowId) {
    if (!audioPlayers[windowId]) audioPlayers[windowId] = { audio: new Audio(), currentTrack: 0 };
    const player = audioPlayers[windowId];
    
    player.currentTrack = index;
    player.audio.src = state.musicFiles[index].url;
    
    document.getElementById(`track-title-${windowId}`).textContent = state.musicFiles[index].name;
    document.getElementById(`track-artist-${windowId}`).textContent = state.musicFiles[index].artist;
    
    player.audio.onloadedmetadata = () => {
        document.getElementById(`duration-${windowId}`).textContent = formatTime(player.audio.duration);
    };
    
    player.audio.ontimeupdate = () => {
        const progress = (player.audio.currentTime / player.audio.duration) * 100;
        document.getElementById(`progress-${windowId}`).style.width = progress + '%';
        document.getElementById(`current-time-${windowId}`).textContent = formatTime(player.audio.currentTime);
    };
    
    player.audio.onended = () => nextTrack(windowId);
    
    updatePlaylist(windowId);
    updatePlayButton(windowId, false);
}

function toggleMusic(windowId) {
    const player = audioPlayers[windowId];
    if (!player || !player.audio.src) {
        showNotification('Music', 'No track loaded', 'fa-exclamation');
        return;
    }
    
    const btn = document.getElementById(`play-btn-${windowId}`);
    if (player.audio.paused) {
        player.audio.play();
        updatePlayButton(windowId, true);
        startVisualizer(windowId);
    } else {
        player.audio.pause();
        updatePlayButton(windowId, false);
        stopVisualizer(windowId);
    }
}

function updatePlayButton(windowId, isPlaying) {
    const btn = document.getElementById(`play-btn-${windowId}`);
    btn.innerHTML = isPlaying ? '<i class="fas fa-pause text-xl"></i>' : '<i class="fas fa-play text-xl ml-1"></i>';
}

function prevTrack(windowId) {
    const player = audioPlayers[windowId];
    if (!player) return;
    let newIndex = player.currentTrack - 1;
    if (newIndex < 0) newIndex = state.musicFiles.length - 1;
    loadTrack(newIndex, windowId);
}

function nextTrack(windowId) {
    const player = audioPlayers[windowId];
    if (!player) return;
    let newIndex = player.currentTrack + 1;
    if (newIndex >= state.musicFiles.length) newIndex = 0;
    loadTrack(newIndex, windowId);
}

function seekMusic(e, windowId) {
    const player = audioPlayers[windowId];
    if (!player || !player.audio.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    player.audio.currentTime = percent * player.audio.duration;
}

function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

let visualizerIntervals = {};

function startVisualizer(windowId) {
    const bars = document.querySelectorAll(`#visualizer-${windowId} .audio-bar`);
    visualizerIntervals[windowId] = setInterval(() => {
        bars.forEach(bar => {
            const height = Math.random() * 30 + 4;
            bar.style.height = height + 'px';
        });
    }, 100);
}

function stopVisualizer(windowId) {
    if (visualizerIntervals[windowId]) {
        clearInterval(visualizerIntervals[windowId]);
        const bars = document.querySelectorAll(`#visualizer-${windowId} .audio-bar`);
        bars.forEach(bar => bar.style.height = '4px');
    }
}

// Calculator
const calcStates = {};
function calcInput(val, windowId) {
    if (!calcStates[windowId]) calcStates[windowId] = '';
    
    const display = document.getElementById(`calc-display-${windowId}`);
    if (val === 'C') {
        calcStates[windowId] = '';
        display.textContent = '0';
    } else if (val === '=') {
        try {
            const expr = calcStates[windowId].replace('×', '*').replace('÷', '/');
            const result = Function('"use strict"; return (' + expr + ')')();
            display.textContent = result;
            calcStates[windowId] = String(result);
        } catch {
            display.textContent = 'Error';
            calcStates[windowId] = '';
        }
    } else if (val === '±') {
        calcStates[windowId] = calcStates[windowId].startsWith('-') ? calcStates[windowId].slice(1) : '-' + calcStates[windowId];
        display.textContent = calcStates[windowId] || '0';
    } else {
        calcStates[windowId] += val;
        display.textContent = calcStates[windowId];
    }
}

// Paint
const canvasStates = {};

function initPaint(windowId) {
    const canvas = document.getElementById(`canvas-${windowId}`);
    const ctx = canvas.getContext('2d');
    
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    canvasStates[windowId] = { canvas, ctx, drawing: false };
    
    // Mouse events
    canvas.addEventListener('mousedown', (e) => startPaint(e, windowId));
    canvas.addEventListener('mousemove', (e) => paint(e, windowId));
    canvas.addEventListener('mouseup', () => stopPaint(windowId));
    canvas.addEventListener('mouseout', () => stopPaint(windowId));
    
    // Touch events
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent('mousedown', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        canvas.dispatchEvent(mouseEvent);
    }, { passive: false });
    
    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent('mousemove', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        canvas.dispatchEvent(mouseEvent);
    }, { passive: false });
    
    canvas.addEventListener('touchend', (e) => {
        e.preventDefault();
        const mouseEvent = new MouseEvent('mouseup', {});
        canvas.dispatchEvent(mouseEvent);
    });
}

function startPaint(e, windowId) {
    const state = canvasStates[windowId];
    state.drawing = true;
    const rect = state.canvas.getBoundingClientRect();
    state.ctx.beginPath();
    state.ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
}

function paint(e, windowId) {
    const state = canvasStates[windowId];
    if (!state.drawing) return;
    
    const rect = state.canvas.getBoundingClientRect();
    const color = document.getElementById(`color-${windowId}`).value;
    const size = document.getElementById(`brush-${windowId}`).value;
    
    state.ctx.lineWidth = size;
    state.ctx.lineCap = 'round';
    state.ctx.strokeStyle = color;
    
    state.ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    state.ctx.stroke();
}

function stopPaint(windowId) {
    if (canvasStates[windowId]) canvasStates[windowId].drawing = false;
}

function clearCanvas(windowId) {
    const state = canvasStates[windowId];
    if (state) {
        state.ctx.fillStyle = 'white';
        state.ctx.fillRect(0, 0, state.canvas.width, state.canvas.height);
    }
}

function saveCanvas(windowId) {
    const state = canvasStates[windowId];
    if (state) {
        const link = document.createElement('a');
        link.download = 'drawing.png';
        link.href = state.canvas.toDataURL();
        link.click();
        showNotification('Paint', 'Image saved', 'fa-image');
    }
}

// Window Management with Touch Support
function closeWindow(id) {
    const win = state.windows.find(w => w.id === id);
    if (win) {
        if (audioPlayers[id]) {
            audioPlayers[id].audio.pause();
            delete audioPlayers[id];
        }
        stopVisualizer(id);
        
        win.element.style.transform = 'scale(0.9)';
        win.element.style.opacity = '0';
        setTimeout(() => {
            win.element.remove();
            state.windows = state.windows.filter(w => w.id !== id);
            if (state.windows.length === 0) {
                els.activeWindowIndicator.classList.add('opacity-0');
            }
        }, 200);
    }
}

function minimizeWindow(id) {
    const win = state.windows.find(w => w.id === id);
    if (win) win.element.style.display = 'none';
}

function maximizeWindow(id) {
    const win = state.windows.find(w => w.id === id);
    if (win) {
        const isMaxed = win.element.style.width === '100%';
        if (isMaxed) {
            win.element.style.width = '800px';
            win.element.style.height = '600px';
            win.element.style.left = '50px';
            win.element.style.top = '50px';
            win.element.style.borderRadius = '0.75rem';
        } else {
            win.element.style.width = '100%';
            win.element.style.height = '100%';
            win.element.style.left = '0';
            win.element.style.top = '0';
            win.element.style.borderRadius = '0';
        }
    }
}

function focusWindow(id) {
    state.windows.forEach(w => {
        w.element.style.zIndex = w.id === id ? '100' : '10';
        if (w.id === id) {
            w.element.classList.add('active-glow');
            els.windowTitleText.textContent = w.app.name;
            els.activeWindowIndicator.classList.remove('opacity-0');
        } else {
            w.element.classList.remove('active-glow');
        }
    });
}

let dragState = { windowId: null, offsetX: 0, offsetY: 0, isTouch: false };

function startDrag(e, windowId) {
    if (e.target.tagName === 'BUTTON') return;
    e.preventDefault();
    
    const isTouch = e.type === 'touchstart';
    const clientX = isTouch ? e.touches[0].clientX : e.clientX;
    const clientY = isTouch ? e.touches[0].clientY : e.clientY;
    
    const win = state.windows.find(w => w.id === windowId);
    const rect = win.element.getBoundingClientRect();
    
    dragState = {
        windowId,
        offsetX: clientX - rect.left,
        offsetY: clientY - rect.top,
        isTouch
    };
    
    win.element.classList.add('dragging');
    focusWindow(windowId);
}

function handleDragMove(e) {
    if (!dragState.windowId) return;
    
    const isTouch = e.type === 'touchmove';
    if (isTouch) e.preventDefault();
    
    const clientX = isTouch ? e.touches[0].clientX : e.clientX;
    const clientY = isTouch ? e.touches[0].clientY : e.clientY;
    
    const win = state.windows.find(w => w.id === dragState.windowId);
    win.element.style.left = (clientX - dragState.offsetX) + 'px';
    win.element.style.top = (clientY - dragState.offsetY) + 'px';
}

function handleDragEnd(e) {
    if (dragState.windowId) {
        const win = state.windows.find(w => w.id === dragState.windowId);
        if (win) win.element.classList.remove('dragging');
        dragState.windowId = null;
    }
}

// System Info
function updateSystemInfo() {
    if ('getBattery' in navigator) {
        navigator.getBattery().then(battery => {
            const level = Math.round(battery.level * 100);
            document.getElementById('battery-text').textContent = level + '%';
            
            const icon = document.getElementById('battery-icon');
            if (level < 20) icon.className = 'fas fa-battery-quarter text-hypr-error';
            else if (level < 50) icon.className = 'fas fa-battery-half text-hypr-warning';
            else icon.className = 'fas fa-battery-full text-hypr-success';
        });
    }
    
    const cpuUsage = Math.floor(Math.random() * 30) + 5;
    document.getElementById('cpu-text').textContent = cpuUsage + '%';
    
    document.getElementById('volume-level').textContent = state.volume;
    
    const wifiIcon = document.getElementById('wifi-icon');
    if (!navigator.onLine) {
        wifiIcon.className = 'fas fa-wifi-slash text-hypr-error';
    }
}

// Search Functions
function searchWeb() {
    const query = els.globalSearch.value.trim();
    if (query) {
        window.open('https://google.com/search?q=' + encodeURIComponent(query), '_blank');
        els.globalSearch.value = '';
    }
}

function searchFiles() {
    const query = els.globalSearch.value.toLowerCase().trim();
    if (!query) return;
    
    // Search in file system
    const results = [];
    function searchFolder(folder, path) {
        for (const [name, item] of Object.entries(folder.children || {})) {
            if (name.toLowerCase().includes(query)) {
                results.push({ name, path: [...path, name], type: item.type });
            }
            if (item.type === 'folder') {
                searchFolder(item, [...path, name]);
            }
        }
    }
    searchFolder(fileSystem.root, []);
    
    if (results.length > 0) {
        showNotification('Search', `Found ${results.length} result(s)`, 'fa-search');
        // Open first result
        if (results[0].type === 'file') {
            openApp('files', results[0].path.slice(0, -1));
        }
    } else {
        showNotification('Search', 'No results found', 'fa-search');
    }
}

// Other Functions
function toggleLauncher() {
    els.launcher.style.display = els.launcher.style.display === 'none' ? 'flex' : 'none';
    if (els.launcher.style.display === 'flex') {
        document.getElementById('launcher-search').focus();
        renderApps();
    }
}

function toggleSettings() {
    els.settingsWindow.classList.toggle('hidden');
}

function toggleNetwork() {
    state.wifi = !state.wifi;
    document.getElementById('wifi-icon').className = state.wifi ? 'fas fa-wifi' : 'fas fa-wifi-slash text-hypr-error';
    showNotification('Network', state.wifi ? 'Connected' : 'Disconnected', 'fa-wifi');
}

function toggleBluetooth() {
    state.bluetooth = !state.bluetooth;
    document.getElementById('bt-icon').className = state.bluetooth ? 'fab fa-bluetooth-b text-hypr-accent' : 'fab fa-bluetooth-b';
    showNotification('Bluetooth', state.bluetooth ? 'Enabled' : 'Disabled', 'fa-bluetooth-b');
}

function toggleBattery() {
    showNotification('Battery', 'Battery info updated', 'fa-battery-half');
}

function toggleVolume() {
    const osd = document.createElement('div');
    osd.className = 'absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 hypr-blur rounded-2xl p-6 z-50 flex flex-col items-center gap-4 window-anim';
    osd.innerHTML = `
        <i class="fas fa-volume-up text-4xl text-hypr-accent"></i>
        <div class="w-48 h-2 bg-hypr-surface rounded-full overflow-hidden">
            <div class="h-full bg-hypr-accent" style="width: ${state.volume}%"></div>
        </div>
        <span class="text-2xl font-bold">${state.volume}%</span>
    `;
    document.body.appendChild(osd);
    setTimeout(() => osd.remove(), 2000);
}

function updateVolume(val) {
    state.volume = val;
    document.getElementById('volume-display').textContent = val + '%';
    
    const icon = document.getElementById('volume-icon');
    if (val == 0) icon.className = 'fas fa-volume-mute text-hypr-error';
    else if (val < 30) icon.className = 'fas fa-volume-low';
    else if (val < 70) icon.className = 'fas fa-volume-down';
    else icon.className = 'fas fa-volume-high';
    
    Object.values(audioPlayers).forEach(player => {
        player.audio.volume = val / 100;
    });
    
    saveState();
}

function applyWallpaper() {
    const url = document.getElementById('wallpaper-input').value;
    if (url) {
        state.wallpaper = url;
        els.wallpaper.style.backgroundImage = `url('${url}')`;
        saveState();
        showNotification('Settings', 'Wallpaper updated', 'fa-image');
    }
}

function handleFileUpload(input) {
    const file = input.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            state.wallpaper = e.target.result;
            els.wallpaper.style.backgroundImage = `url('${e.target.result}')`;
            saveState();
        };
        reader.readAsDataURL(file);
    }
}

function toggleGlow() {
    state.glow = !state.glow;
    const btn = document.getElementById('glow-toggle-btn');
    const knob = btn.querySelector('div');
    if (state.glow) {
        btn.classList.add('bg-hypr-accent');
        btn.classList.remove('bg-gray-600');
        knob.style.right = '4px';
        state.windows.forEach(w => w.element.classList.add('active-glow'));
    } else {
        btn.classList.remove('bg-hypr-accent');
        btn.classList.add('bg-gray-600');
        knob.style.left = '4px';
        state.windows.forEach(w => w.element.classList.remove('active-glow'));
    }
    saveState();
}

function switchWorkspace(ws) {
    state.activeWorkspace = ws;
    document.querySelectorAll('.workspace').forEach(w => {
        w.classList.remove('active');
        w.classList.add('text-hypr-muted');
        if (parseInt(w.dataset.ws) === ws) {
            w.classList.add('active');
            w.classList.remove('text-hypr-muted');
        }
    });
    showNotification('Workspace', `Switched to ${ws}`, 'fa-desktop');
}

function showPowerMenu() {
    els.powerMenu.classList.remove('hidden');
}

function hidePowerMenu() {
    els.powerMenu.classList.add('hidden');
}

function sleepSystem() {
    document.body.style.opacity = '0.1';
    setTimeout(() => {
        document.body.style.opacity = '1';
        hidePowerMenu();
    }, 3000);
}

function restartSystem() {
    location.reload();
}

function shutdownSystem() {
    document.body.innerHTML = '<div class="h-screen w-screen bg-black flex items-center justify-center text-hypr-muted font-mono">System halted.</div>';
}

function resetAll() {
    if (confirm('Reset everything?')) {
        localStorage.removeItem('hypros_complete');
        location.reload();
    }
}

function showNotification(title, message, icon, color) {
    const toast = document.createElement('div');
    toast.className = 'toast hypr-blur rounded-lg p-3 flex items-center gap-3 min-w-[250px] pointer-events-auto';
    toast.innerHTML = `
        <i class="fas ${icon} ${color || 'text-hypr-accent'} text-lg"></i>
        <div class="flex-1">
            <div class="text-sm font-bold">${title}</div>
            <div class="text-xs text-hypr-muted">${message}</div>
        </div>
    `;
    toast.onclick = () => toast.remove();
    els.notifications.appendChild(toast);
    setTimeout(() => toast.remove(), 5000);
}

// Global Events
function setupGlobalEvents() {
    // Window dragging
    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);
    document.addEventListener('touchmove', handleDragMove, { passive: false });
    document.addEventListener('touchend', handleDragEnd);
    
    // Context menu hide
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.context-menu')) hideContextMenu();
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            hideContextMenu();
            if (!els.powerMenu.classList.contains('hidden')) hidePowerMenu();
            else if (els.launcher.style.display !== 'none') toggleLauncher();
            else if (!els.settingsWindow.classList.contains('hidden')) toggleSettings();
        }
        if (e.key === 'Meta' || e.key === 'Super') {
            e.preventDefault();
            toggleLauncher();
        }
    });
    
    // Initialize paint when windows are created
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.id && node.id.startsWith('win-')) {
                    const windowId = node.id;
                    setTimeout(() => {
                        if (document.getElementById(`canvas-${windowId}`)) {
                            initPaint(windowId);
                        }
                    }, 100);
                }
            });
        });
    });
    observer.observe(els.windowsContainer, { childList: true });
    
    // Desktop background click to deselect
    document.getElementById('desktop-area').addEventListener('click', (e) => {
        if (e.target.id === 'desktop-area' || e.target.id === 'wallpaper') {
            document.querySelectorAll('.desktop-icon').forEach(el => el.classList.remove('selected'));
        }
    });
}

// Initialize
init();
