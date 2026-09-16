/*
 * Script de "Café Aroma" - VERSIÓN ESTÁTICA FINAL
 * Integra notificaciones Toast (V2) con carga dinámica desde bd.json y localStorage.
 */

document.addEventListener('DOMContentLoaded', () => {

    // --- 1. ESTADO DEL CARRITO ---
    let carrito = JSON.parse(localStorage.getItem('carrito')) || [];

    // --- 2. FUNCIÓN DE NOTIFICACIÓN TOAST ---
    function mostrarNotificacion(mensaje) {
        const notificacion = document.createElement('div');
        notificacion.classList.add('notificacion-toast'); 
        notificacion.textContent = mensaje;
        document.body.appendChild(notificacion);

        setTimeout(() => {
            notificacion.classList.add('visible');
        }, 10);

        setTimeout(() => {
            notificacion.classList.remove('visible');
            setTimeout(() => {
                if (document.body.contains(notificacion)) {
                    document.body.removeChild(notificacion);
                }
            }, 500); 
        }, 3000);
    }

    // --- 3. LÓGICA DE LA PÁGINA DE MENÚ (menu.html) ---
    const seccionProductos = document.querySelector('.productos');
    
    if (seccionProductos) {
        
        // Cargar productos dinámicamente desde el JSON
        cargarMenu();

        seccionProductos.addEventListener('click', (e) => {
            if (e.target.classList.contains('add-to-cart')) {
                manejarAnadirAlCarrito(e.target);
            }
        });

        async function cargarMenu() {
            try {
                const respuesta = await fetch('bd.json');
                const data = await respuesta.json();
                renderizarMenu(data.productos);
            } catch (error) {
                console.error("Error al cargar el menú:", error);
                seccionProductos.innerHTML = '<p>Error al cargar los productos.</p>';
            }
        }

        function renderizarMenu(productos) {
            seccionProductos.innerHTML = ''; 

            productos.forEach(prod => {
                const div = document.createElement('div');
                div.className = 'producto';
                
                let opcionesHTML = '';
                
                if (prod.tipo === 'fijo') {
                    opcionesHTML = `<span class="precio">${prod.precio.toFixed(2)} €</span>`;
                } else if (prod.tipo === 'radio' && prod.opciones) {
                    opcionesHTML = '<div class="opciones">';
                    prod.opciones.forEach((opc, index) => {
                        const checked = index === 0 ? 'checked' : '';
                        opcionesHTML += `
                            <label>
                                <input type="radio" name="opcion-${prod.id}" value="${opc.variante}" data-precio="${opc.precio}" ${checked}> 
                                ${opc.variante} (${opc.precio.toFixed(2)} €)
                            </label>`;
                    });
                    opcionesHTML += '</div>';
                } else if (prod.tipo === 'select' && prod.opciones) {
                    opcionesHTML = `<select class="select-opcion" id="select-${prod.id}">`;
                    prod.opciones.forEach(opc => {
                        opcionesHTML += `<option value="${opc.variante}" data-precio="${opc.precio}">${opc.variante} (${opc.precio.toFixed(2)} €)</option>`;
                    });
                    opcionesHTML += `</select>`;
                } else if (prod.tipo === 'complejo') {
                    opcionesHTML = `<select class="select-origen" id="origen-${prod.id}">`;
                    prod.opciones.forEach(opc => {
                        opcionesHTML += `<option value="${opc.variante}" data-precio="${opc.precio}">${opc.variante} (${opc.precio.toFixed(2)} €)</option>`;
                    });
                    opcionesHTML += `</select><div class="opciones">`;
                    prod.formatos.forEach((formato, index) => {
                        const checked = index === 0 ? 'checked' : '';
                        opcionesHTML += `
                            <label>
                                <input type="radio" name="formato-${prod.id}" value="${formato}" ${checked}> ${formato}
                            </label>`;
                    });
                    opcionesHTML += '</div>';
                }

                div.innerHTML = `
                    <img src="${prod.imagen}" alt="${prod.nombre}" class="producto-img">
                    <h3>${prod.nombre}</h3>
                    <p>${prod.descripcion}</p>
                    ${opcionesHTML}
                    <button class="add-to-cart" data-id="${prod.id}" data-nombre="${prod.nombre}" data-tipo="${prod.tipo}">Añadir al carrito</button>
                `;
                seccionProductos.appendChild(div);
            });
        }

        function manejarAnadirAlCarrito(boton) {
            const productoDiv = boton.closest('.producto');
            const nombreBase = boton.getAttribute('data-nombre');
            const tipo = boton.getAttribute('data-tipo');
            const id = boton.getAttribute('data-id');
            
            let nombreFinal = nombreBase;
            let precio = 0;

            if (tipo === 'fijo') {
                precio = parseFloat(productoDiv.querySelector('.precio').textContent);
            } else if (tipo === 'radio') {
                const seleccion = productoDiv.querySelector(`input[name="opcion-${id}"]:checked`);
                precio = parseFloat(seleccion.dataset.precio);
                nombreFinal += ` (${seleccion.value})`;
            } else if (tipo === 'select') {
                const select = productoDiv.querySelector(`#select-${id}`);
                const opcion = select.options[select.selectedIndex];
                precio = parseFloat(opcion.dataset.precio);
                nombreFinal += ` (${opcion.value})`;
            } else if (tipo === 'complejo') {
                const select = productoDiv.querySelector(`#origen-${id}`);
                const opcion = select.options[select.selectedIndex];
                const formato = productoDiv.querySelector(`input[name="formato-${id}"]:checked`).value;
                precio = parseFloat(opcion.dataset.precio);
                nombreFinal += ` (${opcion.value}, ${formato})`;
            }

            // Añadir al array del carrito
            const existe = carrito.find(item => item.nombre === nombreFinal);
            if (existe) {
                existe.cantidad++;
            } else {
                carrito.push({ nombre: nombreFinal, precio: precio, cantidad: 1 });
            }

            guardarEnLocalStorage();
            mostrarNotificacion('¡Producto añadido al carrito!');
        }
    } 

    // --- 4. LÓGICA DE LA PÁGINA DE CARRITO (carrito.html) ---
    const listaCarrito = document.getElementById('lista-carrito');
    const vaciarCarritoBtn = document.getElementById('vaciar-carrito');

    if (listaCarrito) {
        
        actualizarVistaCarrito();

        listaCarrito.addEventListener('click', (e) => {
            if (e.target.classList.contains('eliminar-item')) {
                const nombreItem = e.target.dataset.nombre;
                carrito = carrito.filter(item => item.nombre !== nombreItem);
                guardarEnLocalStorage();
                actualizarVistaCarrito();
                mostrarNotificacion('Producto eliminado.');
            }
        });

        if (vaciarCarritoBtn) {
            vaciarCarritoBtn.addEventListener('click', () => {
                if (confirm('¿Estás seguro de que quieres vaciar el carrito?')) {
                    carrito = [];
                    guardarEnLocalStorage();
                    actualizarVistaCarrito();
                    mostrarNotificacion('Carrito vaciado.');
                }
            });
        }

        function actualizarVistaCarrito() {
            const subtotalEl = document.getElementById('subtotal');
            let subtotal = 0;

            listaCarrito.innerHTML = '';

            if (carrito.length === 0) {
                listaCarrito.innerHTML = '<li>Tu carrito está vacío.</li>';
                if(subtotalEl) subtotalEl.textContent = '0.00';
                return; 
            }

            carrito.forEach(item => {
                const li = document.createElement('li');
                const totalItem = (item.precio * item.cantidad).toFixed(2);
                subtotal += (item.precio * item.cantidad);

                li.innerHTML = `
                    <span>${item.nombre} (x${item.cantidad})</span>
                    <span>${totalItem} €</span>
                    <button class="eliminar-item" data-nombre="${item.nombre}">Eliminar</button>
                `;
                listaCarrito.appendChild(li);
            });

            if(subtotalEl) subtotalEl.textContent = subtotal.toFixed(2);
        }
    }

    // --- 5. LÓGICA DEL FORMULARIO DE CONTACTO (contacto.html) ---
    const contactForm = document.getElementById('contact-form');
    
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault(); 
            const boton = contactForm.querySelector('button[type="submit"]');
            
            boton.disabled = true;
            boton.textContent = 'Enviando...';

            // Simulamos un tiempo de carga y una respuesta exitosa
            setTimeout(() => {
                mostrarNotificacion('¡Mensaje enviado con éxito!');
                contactForm.reset();
                boton.disabled = false;
                boton.textContent = 'Enviar Mensaje';
            }, 1000);
        });
    }

    // --- 6. FUNCIÓN DE GUARDADO GENERAL ---
    function guardarEnLocalStorage() {
        localStorage.setItem('carrito', JSON.stringify(carrito));
    }

});