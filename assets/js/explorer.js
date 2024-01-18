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
function goToFolder(ele, url, name) {
	ele.setAttribute("style", `view-transition-name: ${name};`);
	goToUrl(url);
}

function goToUrl(url) {
	window.location.href = url;
}
