

function sendMail() {
    const templateParams = {
        nombre: document.querySelector("#nombre").value,
        email: document.querySelector("#email").value,
        telefono: document.querySelector("#telefono").value,
        
    };

    

    emailjs
    .send("service_pq40us8", "template_dfnraqj", templateParams)
    .then(() => {
        alert("email enviado");
    })
    .catch((error) => {
        console.log("error al enviar el email", error);
        alert("error al enviar el email");
    });
}

