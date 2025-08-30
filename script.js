function normalizarTexto(txt) {
    return txt.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}
document.getElementById('buscador-equipos').addEventListener('input', function() {
    const valor = normalizarTexto(this.value.trim());
    document.querySelectorAll('.equipment-card').forEach(card => {
        const nombre = normalizarTexto(card.querySelector('h3')?.textContent || '');
        const descripcion = normalizarTexto(card.querySelector('p')?.textContent || '');
        if (nombre.includes(valor) || descripcion.includes(valor)) {
            card.style.display = '';
        } else {
            card.style.display = 'none';
        }
    }); // Ensure this matches the correct opening brace or remove if unnecessary
});
let carrito = [];
let total = 0;

// Mostrar/ocultar el carrito desplegable
document.getElementById('carrito-btn').addEventListener('click', () => {
    document.getElementById('carrito-dropdown').classList.toggle('hidden');
});

// Cierra el modal de alquilar
function cerrarModalAlquilar() {
    const modal = document.getElementById('modal-alquilar');
    if (modal) modal.remove();
}

// Actualiza el listado del carrito y el total
function actualizarCarrito() {
    // Actualizar contador (total de unidades)
    const totalUnidades = carrito.reduce((acc, item) => acc + item.unidades, 0);
    document.getElementById('carrito-count').textContent = totalUnidades;
    document.getElementById('carrito-total').textContent = `€${total.toFixed(2)}`;
    document.getElementById('carrito-total2').textContent = `€${total.toFixed(2)}`;

    // Actualizar listado del carrito
    const lista = document.getElementById('carrito-list');
    lista.innerHTML = '';
    carrito.forEach((item, idx) => {
        const li = document.createElement('li');
        li.className = "flex flex-col mb-1 border-b pb-1 px-1";
        li.innerHTML = `
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <span><strong>${item.unidades} unidad${item.unidades>1?'es':''}</strong> de ${item.nombre} <strong>(${item.dias} día${item.dias>1?'s':''})</strong> -<em> €${(item.precio*item.unidades*item.dias).toFixed(2)}</em></span>
                <div class="flex items-center">
                    <button class="ml-2 text-blue-500 hover:text-blue-700 px-2 py-0.5 rounded" data-editar="${idx}" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="ml-2 text-red-500 hover:text-red-700 px-2 py-0.5 rounded" data-eliminar="${idx}" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="hidden mt-2 w-full" id="editar-form-${idx}"></div>
        `;
        lista.appendChild(li);
    });

    // Funcionalidad eliminar
    lista.querySelectorAll('button[data-eliminar]').forEach(btn => {
        btn.onclick = function() {
            const idx = parseInt(btn.getAttribute('data-eliminar'));
            total -= carrito[idx].precio * carrito[idx].unidades * carrito[idx].dias;
            carrito.splice(idx, 1);
            actualizarCarrito();
        };
    });

    // Funcionalidad editar
    lista.querySelectorAll('button[data-editar]').forEach(btn => {
        btn.onclick = function() {
            const idx = parseInt(btn.getAttribute('data-editar'));
            const item = carrito[idx];
            const formDiv = lista.querySelector(`#editar-form-${idx}`);
            if (!formDiv) return;
            // Obtener el máximo de unidades del producto
            let maxUnidades = 10;
            // Buscar el card original para obtener data-max-unidades
            const card = Array.from(document.querySelectorAll('.equipment-card')).find(c => c.querySelector('h3').textContent === item.nombre);
            if (card) {
                const alquilarBtn = card.querySelector('[data-alquilar]');
                if (alquilarBtn) {
                    maxUnidades = parseInt(alquilarBtn.getAttribute('data-max-unidades')) || 2;
                }
            }
            // Opciones de unidades
            let opcionesUnidades = '';
            for(let i=1; i<=maxUnidades; i++) {
                opcionesUnidades += `<option value="${i}" ${i===item.unidades?'selected':''}>${i}</option>`;
            }
            // Opciones de días (1-30)
            let opcionesDias = '';
            for(let d=1; d<=30; d++) {
                opcionesDias += `<option value="${d}" ${d===item.dias?'selected':''}>${d}</option>`;
            }
            formDiv.innerHTML = `
                <form class="flex flex-col sm:flex-row gap-2 items-start sm:items-center w-full">
                    <label class="text-sm font-semibold flex flex-col sm:flex-row items-start sm:items-center">Unidades:
                        <select name="unidades" class="ml-0 sm:ml-1 px-2 py-1 border rounded">${opcionesUnidades}</select>
                    </label>
                    <label class="text-sm font-semibold flex flex-col sm:flex-row items-start sm:items-center">Días:
                        <select name="dias" class="ml-0 sm:ml-1 px-2 py-1 border rounded">${opcionesDias}</select>
                    </label>
                    <div class="flex gap-2 mt-2 sm:mt-0">
                        <button type="submit" class="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded font-bold">Guardar</button>
                        <button type="button" class="bg-gray-300 hover:bg-gray-400 text-gray-700 px-2 py-1 rounded font-bold" id="cancelar-editar-${idx}">Cancelar</button>
                    </div>
                </form>
            `;
            formDiv.classList.remove('hidden');

            // Cancelar edición
            formDiv.querySelector(`#cancelar-editar-${idx}`).onclick = function() {
                formDiv.classList.add('hidden');
            };

            // Guardar cambios
            formDiv.querySelector('form').onsubmit = function(ev) {
                ev.preventDefault();
                const nuevasUnidades = parseInt(formDiv.querySelector('select[name="unidades"]').value);
                const nuevosDias = parseInt(formDiv.querySelector('select[name="dias"]').value);
                // Si hay otro item igual, lo fusiona
                const nombre = item.nombre;
                const precio = item.precio;
                const idxExistente = carrito.findIndex((it, i) => it.nombre === nombre && it.unidades === nuevasUnidades && i !== idx);
                // Restar el total anterior
                total -= item.precio * item.unidades * item.dias;
                if (idxExistente !== -1) {
                    // Fusionar: sumar días si se quiere, o solo actualizar
                    carrito[idxExistente].dias = nuevosDias;
                    // Eliminar el actual
                    carrito.splice(idx, 1);
                } else {
                    item.unidades = nuevasUnidades;
                    item.dias = nuevosDias;
                }
                // Sumar el nuevo total
                total += precio * nuevasUnidades * nuevosDias;
                actualizarCarrito();
            };
        };
    });
}

// Añadir funcionalidad a todos los botones "Alquilar"
document.querySelectorAll('[data-alquilar]').forEach(btn => {
    btn.addEventListener('click', function(e) {
        e.preventDefault();
        cerrarModalAlquilar();

        // Obtener el máximo de unidades para este equipo
        const maxUnidades = parseInt(btn.getAttribute('data-max-unidades')) || 2;
        // Crear opciones dinámicamente
        let opcionesUnidades = '';
        for(let i=1; i<=maxUnidades; i++) {
            opcionesUnidades += `<option value="${i}">${i}</option>`;
        }
        // Crear modal
        const modal = document.createElement('div');
        modal.id = 'modal-alquilar';
        modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40';
        modal.innerHTML = `
            <div class="bg-white rounded-xl shadow-2xl p-6 min-w-[280px] max-w-xs mx-auto flex flex-col space-y-4 relative">
                <button id="cerrar-modal-alquilar" class="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-xl">&times;</button>
                <h4 class="font-bold text-lg mb-2 text-blue-700">Alquilar equipo</h4>
                <label class="text-sm font-semibold flex items-center">Unidades:
                    <select id="unidades" class="ml-2 px-2 py-1 border rounded">
                        ${opcionesUnidades}
                    </select>
                </label>
                <label class="text-sm font-semibold flex items-center">Días:
                    <input type="number" min="1" value="1" id="dias" class="ml-2 w-16 px-2 py-1 border rounded" />
                </label>
                <button type="button" id="añadir-alquilar" class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded font-bold">Añadir al carrito</button>
            </div>
        `;
        document.body.appendChild(modal);

        // Cerrar modal al pulsar la X o fuera del modal
        modal.querySelector('#cerrar-modal-alquilar').onclick = cerrarModalAlquilar;
        modal.onclick = function(ev) {
            if (ev.target === modal) cerrarModalAlquilar();
        };

        // Añadir al carrito al pulsar "Añadir"
        modal.querySelector('#añadir-alquilar').onclick = function() {
            const unidades = parseInt(modal.querySelector('#unidades').value);
            const dias = parseInt(modal.querySelector('#dias').value);

            // Obtener datos del producto
            const card = btn.closest('.equipment-card');
            const nombre = card.querySelector('h3').textContent;
            const precioTexto = card.querySelector('span.text-blue-600').textContent;
            const precio = parseFloat(precioTexto.replace('€','').replace('/día','').replace(',','.'));

            // Buscar si ya existe el mismo producto con las mismas unidades
            const idxExistente = carrito.findIndex(item => item.nombre === nombre && item.unidades === unidades);
            if (idxExistente !== -1) {
                // Restar el total anterior
                total -= carrito[idxExistente].precio * carrito[idxExistente].unidades * carrito[idxExistente].dias;
                // Actualizar días y precio
                carrito[idxExistente].dias = dias;
                carrito[idxExistente].precio = precio;
                // Sumar el nuevo total
                total += precio * unidades * dias;
            } else {
                // Añadir al carrito
                carrito.push({ nombre, precio, unidades, dias });
                total += precio * unidades * dias;
            }

            actualizarCarrito();

            // Cerrar modal
            cerrarModalAlquilar();
        };
    });
});

// Ocultar el carrito si se hace clic fuera de la zona del carrito
document.addEventListener('mousedown', function(event) {
    const carritoHeader = document.getElementById('carrito-header');
    const carritoDropdown = document.getElementById('carrito-dropdown');
    if (!carritoHeader.contains(event.target)) {
        carritoDropdown.classList.add('hidden');
    }
});

// Mostrar el modal de contacto
document.getElementById('contacto-link').addEventListener('click', function(e) {
    e.preventDefault();
    document.getElementById('contacto-modal').classList.remove('hidden');
});

// Cerrar el modal de contacto
document.getElementById('close-contacto-modal').addEventListener('click', function() {
    document.getElementById('contacto-modal').classList.add('hidden');
});

// Cerrar el modal al hacer clic fuera de la ventana
document.getElementById('contacto-modal').addEventListener('click', function(e) {
    if (e.target === this) {
        this.classList.add('hidden');
    }
});

// Enviar presupuesto
document.getElementById('enviar-presupuesto').addEventListener('click', function() {
    const modal = document.getElementById('modal-enviar-presupuesto');
    const resumenList = document.getElementById('resumen-list');
    resumenList.innerHTML = '';
    carrito.forEach(item => {
        const li = document.createElement('li');
        li.textContent = `${item.unidades} unidad${item.unidades > 1 ? 'es' : ''} de ${item.nombre} (${item.dias} día${item.dias > 1 ? 's' : ''}) - €${(item.precio * item.unidades * item.dias).toFixed(2)}`;
        resumenList.appendChild(li);
    });
    console.log("Contenido de #resumen-list:", resumenList.innerHTML); // Depuración
    modal.classList.remove('hidden');
});

// Cerrar modal de enviar presupuesto
document.getElementById('cerrar-modal-enviar').addEventListener('click', function() {
    document.getElementById('modal-enviar-presupuesto').classList.add('hidden');
});

document.getElementById('modal-enviar-presupuesto').addEventListener('click', function(e) {
    if (e.target === this) {
        this.classList.add('hidden');
    }
});

//ENVIO DEL MAAAAAAAAAAILLLLLLLL
function sendMail() {
    const nombre = document.querySelector("#nombre").value.trim();
    const email = document.querySelector("#email").value.trim();
    const telefono = document.querySelector("#telefono").value.trim();

    // Convierte el contenido del carrito a texto plano
    const resumenList = document.querySelectorAll("#resumen-list li");
    const resumen = Array.from(resumenList)
        .map(item => item.textContent.trim())
        .join("\n"); // Cada elemento en una nueva línea

    console.log("Contenido del carrito como texto plano:", resumen); // Depuración

    // Validación de campos
    if (!nombre || !email || !telefono || !resumen) {
        alert("Por favor, complete todos los campos y asegúrese de que el carrito no esté vacío.");
        return;
    }

    // Parámetros para EmailJS
    const templateParams = {
        nombre: nombre,
        email: email,
        telefono: telefono,
        resumen: resumen, // Envía el contenido como texto plano
    };

    // Envío del correo con EmailJS
    emailjs
        .send("service_pq40us8", "template_dfnraqj", templateParams)
        .then(() => {
            alert("Presupuesto enviado correctamente, en breves nos pondremos en contacto con usted.");

            // Cerrar el modal de enviar presupuesto
            document.getElementById('modal-enviar-presupuesto').classList.add('hidden');

            // Vaciar el carrito y reiniciar el total
            carrito = [];
            total = 0;
            actualizarCarrito(); // Actualiza el DOM para reflejar los cambios

            // Limpiar la consola
            console.clear();
            console.log("El carrito ha sido reiniciado.");
        })
        .catch((error) => {
            console.error("Error al enviar el email:", error);
            alert("Error al enviar el email. Por favor, inténtelo de nuevo.");
        });
}

carrito = [];
total = 0;
actualizarCarrito();

console.clear();
console.log("El carrito ha sido reiniciado.");

document.getElementById('modal-enviar-presupuesto').classList.add('hidden');