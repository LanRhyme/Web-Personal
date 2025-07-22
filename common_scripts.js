document.addEventListener('DOMContentLoaded', () => {
    // --- Theme Toggle Script ---
    const themeToggle = document.getElementById('theme-toggle');
    const htmlElement = document.documentElement;

    // Function to set theme
    function setTheme(theme) {
        if (theme === 'dark') {
            htmlElement.classList.add('dark-mode');
            localStorage.setItem('theme', 'dark');
        } else {
            htmlElement.classList.remove('dark-mode');
            localStorage.setItem('theme', 'light');
        }
    }

    // Initialize theme based on local storage or system preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        setTheme(savedTheme);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        setTheme('dark');
    } else {
        setTheme('light');
    }

    // Toggle theme on button click
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            if (htmlElement.classList.contains('dark-mode')) {
                setTheme('light');
            } else {
                setTheme('dark');
            }
        });
    }

    // --- Custom Cursor Script ---
    const customCursor = document.getElementById('custom-cursor');
    if (customCursor) {
        document.addEventListener('mousemove', (e) => {
            customCursor.style.left = `${e.clientX}px`;
            customCursor.style.top = `${e.clientY}px`;
        });
    }

    // Add cursor growth on interactable elements
    const interactableElements = 'a, button, .nav-item, #theme-toggle, .menu-item, .amethyst-dark-button, .solid-card, [onclick], [role="button"], input[type="button"], input[type="submit"]';

    document.addEventListener('mouseover', (e) => {
        if (e.target.closest(interactableElements)) {
            customCursor?.classList.add('grow');
        }
    });

    document.addEventListener('mouseout', (e) => {
        if (e.target.closest(interactableElements)) {
            if (!e.relatedTarget || !e.relatedTarget.closest(interactableElements)) {
                customCursor?.classList.remove('grow');
            }
        }
    });

    // Ensure cursor is hidden if it leaves the window
    document.addEventListener('mouseleave', () => {
        if (customCursor) {
            customCursor.style.display = 'none';
        }
    });

    document.addEventListener('mouseenter', () => {
        if (customCursor) {
            customCursor.style.display = 'block';
        }
    });

    // --- Right-Click Menu Script (from CRCMenu.js) ---
    const customMenu = document.getElementById('custom-context-menu');
    let currentTarget = null; // To store the element that was right-clicked
    let selectedText = ''; // To store selected text for copy action
    let focusedElementBeforeMenu = null; // To store focused element for paste action

    if (customMenu) {
        document.addEventListener('contextmenu', function (e) {
            e.preventDefault(); // Prevent default right-click menu
            currentTarget = e.target; // Store the clicked element
            selectedText = window.getSelection().toString(); // Get selected text
            focusedElementBeforeMenu = document.activeElement; // Store currently focused element

            positionMenu(e);
            updateMenuOptions();
            customMenu.style.display = 'block';
        });

        document.addEventListener('click', function (e) {
            // Hide menu if click outside and menu is visible
            if (customMenu.style.display === 'block' && !customMenu.contains(e.target)) {
                customMenu.style.display = 'none';
            }
        });

        // Re-hide menu if window is resized or scrolled
        window.addEventListener('resize', hideMenu);
        window.addEventListener('scroll', hideMenu);
    }

    function hideMenu() {
        if (customMenu) {
            customMenu.style.display = 'none';
        }
    }

    function positionMenu(e) {
        const menuWidth = customMenu.offsetWidth;
        const menuHeight = customMenu.offsetHeight;
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        let x = e.clientX;
        let y = e.clientY;

        // Adjust x position if menu overflows to the right
        if (x + menuWidth > viewportWidth) {
            x = viewportWidth - menuWidth - 10; // 10px padding from edge
        }
        // Adjust y position if menu overflows to the bottom
        if (y + menuHeight > viewportHeight) {
            y = viewportHeight - menuHeight - 10; // 10px padding from edge
        }

        customMenu.style.left = `${x}px`;
        customMenu.style.top = `${y}px`;
    }

    function updateMenuOptions() {
        const backItem = document.getElementById('menu-back');
        const refreshItem = document.getElementById('menu-refresh');
        const copyItem = document.getElementById('menu-copy');
        const pasteItem = document.getElementById('menu-paste');
        const openInNewTabItem = document.getElementById('menu-open-new-tab');
        const copyLinkItem = document.getElementById('menu-copy-link');

        const isInputOrTextarea = currentTarget && (currentTarget.tagName === 'INPUT' || currentTarget.tagName === 'TEXTAREA' || currentTarget.isContentEditable);
        const isLink = currentTarget && currentTarget.tagName === 'A' && currentTarget.href;

        copyItem.style.display = selectedText ? 'flex' : 'none';
        pasteItem.style.display = isInputOrTextarea ? 'flex' : 'none';
        openInNewTabItem.style.display = isLink ? 'flex' : 'none';
        copyLinkItem.style.display = isLink ? 'flex' : 'none';
    }

    function backAction() {
        window.history.back();
        hideMenu();
    }

    function refreshAction() {
        window.location.reload();
        hideMenu();
    }

    async function copyAction() {
        if (selectedText) {
            try {
                await navigator.clipboard.writeText(selectedText);
                console.log('Text copied to clipboard');
            } catch (err) {
                console.error('Failed to copy text: ', err);
            }
        }
        hideMenu();
    }

    function openInNewTabAction() {
        if (currentTarget && currentTarget.href) {
            window.open(currentTarget.href, '_blank');
        }
        hideMenu();
    }

    async function copyLinkAction() {
        if (currentTarget && currentTarget.href) {
            try {
                await navigator.clipboard.writeText(currentTarget.href);
                console.log('Link copied to clipboard');
            } catch (err) {
                console.error('Failed to copy link: ', err);
            }
        }
        hideMenu();
    }

    function backToHomeAction() {
        window.location.href = '/';
        hideMenu();
    }

    async function pasteAction() {
        const targetElement = focusedElementBeforeMenu;
        if (targetElement && (targetElement.tagName === 'INPUT' || targetElement.tagName === 'TEXTAREA' || targetElement.isContentEditable)) {
            try {
                const text = await navigator.clipboard.readText();
                targetElement.focus();
                // Attempt to insert text at cursor position or end
                document.execCommand('insertText', false, text);
                console.log('Text pasted');
            } catch (err) {
                console.error('Failed to paste text: ', err);
            }
        }
        hideMenu();
    }

    // Expose functions to the global scope if they are called from inline HTML (e.g., onclick)
    window.backAction = backAction;
    window.refreshAction = refreshAction;
    window.copyAction = copyAction;
    window.openInNewTabAction = openInNewTabAction;
    window.copyLinkAction = copyLinkAction;
    window.backToHomeAction = backToHomeAction;
    window.pasteAction = pasteAction;

    // --- Navigation Bar Tracker Script ---
    const navItems = document.querySelectorAll('.nav-item');
    const tracker = document.querySelector('.tracker');

    if (navItems.length > 0 && tracker) {
        // Function to update tracker position
        function updateTracker(activeItem) {
            if (activeItem) {
                tracker.style.width = `${activeItem.offsetWidth}px`;
                tracker.style.transform = `translateX(${activeItem.offsetLeft}px)`;
                tracker.style.display = 'block'; // Show tracker
            } else {
                tracker.style.display = 'none'; // Hide tracker if no active item
            }
        }

        // Set initial tracker position based on current active item (if any)
        const initialActiveItem = document.querySelector('.nav-item.active');
        updateTracker(initialActiveItem);

        navItems.forEach(item => {
            item.addEventListener('mouseenter', () => {
                updateTracker(item);
            });
            item.addEventListener('mouseleave', () => {
                // Revert to the active item's position on mouse leave, or hide if none
                updateTracker(initialActiveItem);
            });
        });

        // Update tracker on window resize to ensure correct position
        window.addEventListener('resize', () => {
            updateTracker(document.querySelector('.nav-item.active'));
        });
    }
});