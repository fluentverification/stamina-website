let navOpen = true;

function closeSidebar() {
	console.log("Closing sidebar");
	let navbarContainer = document.getElementById('side-nav');
	let navbarList = document.getElementById('side-nav-list');
	let closeButtonIcon = document.getElementById('toggle-icon');
// 	let closeButtonLabel = document.getElementById('togglenav-label');
	let r = document.querySelector(':root');
	navbarList.style.display = "none";
	closeButtonIcon.classList.remove('icon_sidebar-collapse-left');
	closeButtonIcon.classList.add('icon_sidebar-expand-left');
	r.style.setProperty("--sidebar-width", "50px");
	r.style.setProperty("--sidebar-width-padded", "100px");
	r.style.setProperty("--label-display", "none");
	navOpen = false;
}

function openSidebar() {
	console.log("Opening sidebar");
	let navbarContainer = document.getElementById('side-nav');
	let navbarList = document.getElementById('side-nav-list');
	let closeButtonIcon = document.getElementById('toggle-icon');
// 	let closeButtonLabel = document.getElementById('togglenav-label');
	let r = document.querySelector(':root');
	navbarList.style.display = "block";
	closeButtonIcon.classList.add('icon_sidebar-collapse-left');
	closeButtonIcon.classList.remove('icon_sidebar-expand-left');
	r.style.setProperty("--sidebar-width", "200px");
	r.style.setProperty("--sidebar-width-padded", "250px");
	r.style.setProperty("--label-display", "inline");
	navOpen = true;
}

function toggleNav() {
	if (navOpen) {
		closeSidebar();
	}
	else {
		openSidebar();
	}
}

function searchWiki() {
	alert("The STAMINA wiki is still under development. This has not been implemeted yet.");
}

function wikiTree() {
	alert("The STAMINA wiki is still under development. This has not been implemeted yet.");
}

window.onload = function () { closeSidebar(); }