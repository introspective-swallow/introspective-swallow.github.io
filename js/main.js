function showSection(sectionId) {
    const sections = ['home', 'projects', 'about'];
    sections.forEach(id => {
        document.getElementById(id).style.display = id === sectionId ? 'block' : 'none';
    });
}

function navigateSection(){
    // You can get url_string from window.location.href if you want to work with
    var url_string = window.location.href;
    var url = new URL(url_string);
    var sectionId = url.searchParams.get("sec");
    console.log(sectionId);
    showSection(sectionId || 'home');
}
