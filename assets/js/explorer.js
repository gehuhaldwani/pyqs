function changeView() {
	document.body.classList.toggle("gridView");
}
function toggleView() {
	if (!document.startViewTransition) {
		changeView();
	} else {
		const transition = document.startViewTransition(() =>
			changeView(gridView)
		);
	}
	gridView = !gridView;
	window.localStorage.gridView = gridView;
}

let gridView = false;
if (window.localStorage.gridView == "true") {
	gridView = true;
}
if (gridView) {
	document.body.classList.add("gridView");
}

// Go To
function goToFolder(ele, url, name, newTab = false) {
	ele.setAttribute("style", `view-transition-name: ${name};`);
	goToUrl(url, newTab);
}

function goToUrl(url = "", newTab = false) {
	if (newTab) {
		window.open(url, "_blank").focus();
	} else {
		window.location.href = url;
	}
}

function handleAuxClickToFolder(e, ele, url, name) {
	if (e.button === 1) {
		goToFolder(ele, url, name, true);
	}
}
