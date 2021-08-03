
let camposVacios = false
let idBoton, nombreCultivo, imagenPoligono
const table = document.querySelector("#tabla-1")

const nombreHuerto = document.getElementById('tituloDetalle')
const cloudCoverage = document.querySelector("#p-cloudCoverage")
const sunElevation = document.querySelector("#p-sunElevation")
const date = document.querySelector("#p-date")
const satellite = document.querySelector("#p-satellite")
const view_id = document.querySelector("#p-view_id")
const imgCultivo = document.querySelector('#img-cultivo')
const cerrarModalCultivo1 = document.getElementById('cerrar-modal-cultivo')
const cerrarModalCultivo2 = document.getElementById('btn-cerrar-modal-cultivo')
const cargandoCultivos = document.getElementById('cargando-cultivos')
const divCargando = document.createElement('div')
const fechaDesde = document.getElementById('fecha-desde')
const fechaHasta = document.getElementById('fecha-hasta')
const pxTamano = document.getElementById('px-tamano')
const botonVerDetalle = document.getElementById('btn-aceptar-modal-form')
nombreHuerto.textContent = 'Detalle Huerto:'

const bId = document.createElement('b')
bId.textContent = 'ID: '
view_id.appendChild(bId)

const bCloud = document.createElement('b')
bCloud.textContent = 'Cobertura de nubes: '
cloudCoverage.appendChild(bCloud)

const bSun = document.createElement('b')
bSun.textContent = 'Elevacion del sol: '
sunElevation.appendChild(bSun)

const bDate = document.createElement('b')
bDate.textContent = 'Fecha Ultimo registro: '
date.appendChild(bDate)

const bSatellite = document.createElement('b')
bSatellite.textContent = 'Satelite: '
satellite.appendChild(bSatellite)

cerrarModalCultivo1.addEventListener('click', (ev) => {
  ev.preventDefault()
  limpiarCampos()
})

cerrarModalCultivo2.addEventListener('click', (ev) => {
  ev.preventDefault()
  limpiarCampos()
})

// llenar tabla
fetch('http://localhost:9002/api/geometry/', {
  method:'GET'
  })
  .then( response => response.json())
  .then( response => {
    response.resp.result.forEach(item => {
    let trBody = document.createElement('tr')
    let id = document.createElement('td')
    let group = document.createElement('td')
    let type = document.createElement('td')
    let area = document.createElement('td')
    let buttonPolygon = document.createElement('td')
    let button = document.createElement('a')

    button.appendChild(document.createTextNode('Ver detalle'))
    button.setAttribute('class', 'btn-hover-detalle')
    button.setAttribute('type', 'button')
    button.setAttribute('data-id-poligono', item.id)
    button.setAttribute('data-id-grupo', item.properties.group)

    button.addEventListener('click', (ev)=> {
      ev.preventDefault();
      idBoton = ev.target.dataset.idPoligono
      nombreCultivo = ev.target.dataset.idGrupo
      // console.log(ev.target.dataset)
      $('#modalFormDetalle').modal('show')
    })

    buttonPolygon.appendChild(button)
    id.appendChild(document.createTextNode(item.id))
    group.appendChild(document.createTextNode(item.properties.group))
    type.appendChild(document.createTextNode(item.type))
    area.appendChild(document.createTextNode(item.area))

    trBody.appendChild(id)
    trBody.appendChild(group)
    trBody.appendChild(type)
    trBody.appendChild(area)
    trBody.appendChild(buttonPolygon)
    table.appendChild(trBody)
    });
  })

  botonVerDetalle.addEventListener('click', (ev) => {
    ev.preventDefault()
    const data = {
      from:fechaDesde.value,
      to:fechaHasta.value,
      bm_type:["NDVI"],
      id:idBoton,
      px: parseInt(pxTamano.value),
      limit:1
    }
    detalleCultivo(data, nombreCultivo)
  })

  // detalle cultivo
  const detalleCultivo = (data, nombreCultivo) => {
    cargandoCultivos.classList.replace('d-none', 'fixed')
    divCargando.classList.add('alert', 'alert-primary', 'text-center', 'h4')
    divCargando.setAttribute('role', 'alert')
    divCargando.textContent = 'Cargando Espere un momento...'
    cargandoCultivos.appendChild(divCargando)

    if (validarCampos(pxTamano.value) && validarCampos(fechaDesde.value) && validarCampos(fechaHasta.value)) {
    fetch('http://localhost:9002/api/geos/high-level', {
      method:'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(data)
      })
      .then( response => response.json())
      .then( response => { 
              
        cargandoCultivos.removeChild(divCargando)
        cargandoCultivos.classList.replace('fixed', 'd-none')
        $('#modalDetalle').modal('show')

        if (response.resp.meta.found > 0) {
          response.resp.results.forEach(item => {
            nombreHuerto.textContent += ` ${nombreCultivo}`
            view_id.appendChild(document.createTextNode(`${item.view_id}`))
            cloudCoverage.appendChild(document.createTextNode(`${item.cloudCoverage}%`))
            sunElevation.appendChild(document.createTextNode(`${item.sunElevation}`))
            date.appendChild(document.createTextNode(`${item.date}`))
            satellite.appendChild(document.createTextNode(`${item.satellite}`))
            guardarImagen(item.image.NDVI)
          })        
        }else {
          nombreHuerto.textContent += ` ${nombreCultivo}`
          view_id.appendChild(document.createTextNode('Sin informacion'))
          cloudCoverage.appendChild(document.createTextNode('Sin informacion'))
          sunElevation.appendChild(document.createTextNode('Sin informacion'))
          date.appendChild(document.createTextNode('Sin registros en el rango de fechas'))
          satellite.appendChild(document.createTextNode('Sin informacion'))
        }
      })
    }
  }

  // let estadoImagen = true
  const guardarImagen = (url) => {
    let tiempo = 6000, texto
    fetch(url, {
      method: 'GET'
    })
    .then(resp => resp.json())
    .then(resp => {
        resp.status === 'created'? (texto = 'Creando imagen...'): (texto = 'Error...', tiempo = 1000)
        let timerInterval;
        Swal.fire({
          icon: "info",
          iconColor: "gray",
          text: texto,
          timer: tiempo+1500,
          timerProgressBar: true,
          didOpen: () => {
            Swal.showLoading();
            timerInterval = setInterval(() => {
              const content = Swal.getHtmlContainer();
              if (content) {
                const b = content.querySelector("b");
                if (b) {
                  b.textContent = Swal.getTimerLeft();
                }
              }
            }, 100);
          },
          willClose: () => {
            clearInterval(timerInterval);
          },
        });
    })
      setTimeout(() => {
        fetch(url, {
          method: 'GET'
        })
        .then(resp => resp.json())
        .then(resp => {
          imagenPoligono = resp.url
          console.log(imagenPoligono)
          imgCultivo.innerHTML = `<img src="${resp.url}" alt="imagen cultivo">`
        }) 
      }, tiempo)
    }

  const limpiarCampos = () => {
    nombreHuerto.textContent = 'Detalle Huerto:'
    cloudCoverage.lastChild.textContent = ''
    sunElevation.lastChild.textContent = ''
    date.lastChild.textContent = ''
    satellite.lastChild.textContent = ''
    view_id.lastChild.textContent = ''
    fechaHasta.value = ''
    fechaDesde.value = ''
    pxTamano.value = ''
  }

  const validarCampos = (campo) => {
    if (campo === '') {
      Swal.fire('Atencion','Debes llenar todos los campos', 'warning')
      cargandoCultivos.removeChild(divCargando)
      cargandoCultivos.classList.replace('fixed', 'd-none')
      return false
    } else {
      return true
    }
  }