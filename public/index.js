const pre = document.querySelector("#respuesta_json");
const apikey = 'apk.1564cdc61b603ab6ce286dccbac40024d656eda262eb0307cd1d2077795aa03a';

const url = `https://gate.eos.com/api/cz/backend`;

const fieldId = 7333690;
const apiBaseCrud = `https://gate.eos.com/api/cz/backend/api/field`;
const apiCrear = `?api_key=${apikey}`;




const resultado_kmz = document.querySelector("#resultado_kmz")

let jsonKmzii;
let coordenadasListas = [];

// const id = "7333389";
const id = "7333690";


fetch(`${url}/api/field/${id}?api_key=${apikey}`, {
    method:'GET'
})
.then(response => {
    return response.json();
})
.then(data => {
    pre.innerHTML = JSON.stringify(data);
    console.log(data);
})
.catch(error => {
    // handle the error
    pre.innerHTML = JSON.stringify(error);
});


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

    console.log("body", body)
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


const transformKmzToJson = (kmzInputFile) => {
    

    let getDom = xml => (new DOMParser()).parseFromString(xml, "text/xml")
    let getExtension = fileName => fileName.split(".").pop()

    let getKmlDom = (kmzFile) => {
        var zip = new JSZip()
        return zip.loadAsync(kmzFile)
            .then(zip => {
                let kmlDom = null
                zip.forEach((relPath, file) => {
                    if (getExtension(relPath) === "kml" && kmlDom === null) {
                        kmlDom = file.async("string").then(getDom)
                    }
                })
                return kmlDom || Promise.reject("No kml file found")
            });
    }
    
        let geoJson = getKmlDom(kmzInputFile).then(kmlDom => {
            let geoJsonObject = toGeoJSON.kml(kmlDom)
            return geoJsonObject
        })
        geoJson.then(gj => {
            
            jsonKmzii = gj

            const coordenadas = jsonKmzii["features"][0]["geometry"]["coordinates"][0]

            resultado_kmz.innerHTML = JSON.stringify(coordenadas, '', ' ')
            // console.log(coordenadas);

            coordenadas.forEach(el => {
                el.pop()
                coordenadasListas.push(el)
            });
        })
    
}


const btnTransformarKmz = document.querySelector("#btnTransformarKmz")
const btnSendApi = document.querySelector("#btnSendApi")
const btnEliminar = document.querySelector("#btnEliminar")



btnTransformarKmz.addEventListener('click', (ev) => {
    ev.preventDefault()
    const geosKmz = document.getElementById("geosKmz")
    transformKmzToJson(geosKmz.files[0])

})


btnSendApi.addEventListener('click', (ev) => {
    ev.preventDefault()
    createFeature()
})

btnEliminar.addEventListener('click', (ev) => {
    ev.preventDefault()
    const deleteId = document.querySelector("#delete").value
    eliminarFeature(deleteId)
})



