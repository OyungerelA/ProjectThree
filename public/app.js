// JS file for landing page (index.html), client-side
// ---------------------------------------------------

window.addEventListener('load', () => {
    // form taking user name and room name
    let joinForm = document.getElementById('join-form');

    joinForm.addEventListener('submit', (e) => {
        e.preventDefault();

        let name = document.getElementById('name-input').value;
        let room = document.getElementById('room-input').value;
        // console.log(name, room);

        // save the user info and room in the sessions storage to retrieve later
        sessionStorage.setItem('name', name);
        sessionStorage.setItem('room', room);

        // take the user to the main page once they enter username and roomname
        window.location = '/board.html';
    })

    // when the user hovers over the text 'STUCK' at the bottom right, instructions will be displayed
    let helpInfo = document.getElementById('help-text');
    helpInfo.addEventListener('mouseover', () => {
        document.getElementById('instructions').style.display = 'block';
    })

    // when mouse leaves the text, don't display the instruction
    helpInfo.addEventListener('mouseleave', () => {
        document.getElementById('instructions').style.display = 'none';
    })
})