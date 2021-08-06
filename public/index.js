
const eliminarFeature = (deleteId) => {

    let apiDelete = `/${deleteId}?api_key=${apikey}`;

    fetch(`${apiBaseCrud}${apiDelete}`, {
        method:'DELETE'
    })
    .then( response => response.json())
    .then( data => {
        resultado_kmz.innerHTML = JSON.stringify(data)
    })
    .catch( error => pre.innerHTML = JSON.stringify(error))
}

const createFeature = () => {

    const message = document.querySelector("#message").value
    const name = document.querySelector("#name").value


    const apiUpdate = `/${fieldId}?api_key=${apikey}`;

    // console.log(coordenadasListas);

    let body = {
        type:"Feature",
        properties: {
            crop_type:"Bananas",
            name: `${name}`,
            group:"GRUPO_API",
            area:"58.6"
        },
        geometry:{
            type:"Polygon",
            coordinates: coordenadasListas
        }
    }
    fetch(`${apiBaseCrud}${apiCrear}`, {
        method:'POST',
        headers: {
            "Content-Type":"application/json"
        },
        body:JSON.stringify(body),
    })
    .then( response => response.json())
    .then( data => {
        resultado_kmz.innerHTML = JSON.stringify(data)
    })
    .catch( error => pre.innerHTML = JSON.stringify(error))

}

