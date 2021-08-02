
let idCultivo
const table = document.querySelector("#tabla-1")

const nombreHuerto = document.getElementById('exampleModalLabel')
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
nombreHuerto.textContent = 'Detalle Huerto:'

const bCloud = document.createElement('b')
bCloud.textContent = 'Cobertura de nubes: '
cloudCoverage.appendChild(bCloud)

const bSun = document.createElement('b')
bSun.textContent = 'Elevacion del sol: '
sunElevation.appendChild(bSun)

const bDate = document.createElement('b')
bDate.textContent = 'Fecha: '
date.appendChild(bDate)

const bSatellite = document.createElement('b')
bSatellite.textContent = 'Satellite: '
satellite.appendChild(bSatellite)

const bId = document.createElement('b')
bId.textContent = 'ID: '
view_id.appendChild(bId)

cerrarModalCultivo1.addEventListener('click', (ev) => {
  ev.preventDefault()
  limpiarCampos()
})

cerrarModalCultivo2.addEventListener('click', (ev) => {
  ev.preventDefault()
  limpiarCampos()
})


//#red 
// funciones
//#

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
    // button.setAttribute('data-toggle', 'modal')
    // button.setAttribute('data-target', '#modalDetalle')
    button.setAttribute('data-id-poligono', item.id)
    button.setAttribute('data-id-grupo', item.properties.group)

    button.addEventListener('click', (ev)=> {
      ev.preventDefault();
      const idBoton = ev.target.dataset.idPoligono
      const nombreCultivo = ev.target.dataset.idGrupo
      const data = {
        from:fechaDesde.value,
        to:fechaHasta.value,
        bm_type:["NDVI"],
        id:idBoton,
        px: parseInt(pxTamano.value),
        limit:1
      }
      // console.log(ev.target.dataset)
      detalleCultivo(data, nombreCultivo)
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

  // detalle cultivo
  const detalleCultivo = (data, nombreCultivo) => {

    // const divCargando = document.createElement('div')
    // divCargando.classList.add('bg-light', 'p-5', 'w-25', 'mx-auto', 'rounded-lg', 'shadow')
    // cargandoCultivos.appendChild(divCargando)
    // const h5Cargando = document.createElement('h4')
    // h5Cargando.classList.add('text-center', 'text-danger')
    // h5Cargando.textContent = 'Cargando...'
    // divCargando.appendChild(h5Cargando)
    
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
        
        console.log(response)
        // cargandoCultivos.removeChild(divCargando)
        cargandoCultivos.removeChild(divCargando)
        cargandoCultivos.classList.replace('fixed', 'd-none')
        $('#modalDetalle').modal('show')
        response.resp.results.forEach(item => {
          console.log(item.image.NDVI)
          nombreHuerto.textContent += ` ${nombreCultivo}`
          cloudCoverage.appendChild(document.createTextNode(`${item.cloudCoverage}`))
          sunElevation.appendChild(document.createTextNode(`${item.sunElevation}`))
          date.appendChild(document.createTextNode(`${item.date}`))
          satellite.appendChild(document.createTextNode(`${item.satellite}`))
          view_id.appendChild(document.createTextNode(`${item.view_id}`))
          // imgCultivo.innerHTML = `<img src="${item.image.NDVI} alt="imagen cultivo..."">`
        })
      })
    }
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