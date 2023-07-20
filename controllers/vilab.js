const fs = require("fs");
const { default: axios } = require("axios");
const ftp = require("basic-ftp");
const { v4: uuidv4 } = require("uuid");
const { Op } = require("sequelize");

const {
  DatoExport,
  DatoVegetable,
  DatoVegetableProd,
  DatoExportProd,
  DatoExportPrueb,
  DatoVegetablePrueb,
} = require("../models/database/datos-geos");

const {
  AnexoExport,
  AnexoVegetable,
  AnexoExportProd,
  AnexoVegetableProd,
  AnexoExportPrueb,
  AnexoVegetablePrueb,
} = require("../models/database/anexo-contrato");
const { Buffer } = require("buffer");

const { conectarseABd } = require("../database/connection");
//endpoint high-level
//endpoint statistics

const getPredios = async (anexoBusca) => {
  try {
    const instancia = axios.create({
      baseURL: `${process.env.URLBASEVILAB}/predios/key/${process.env.APIKEYVILAB}`,
      method: "get",
    });
    const resp = await instancia.get();
    const predios = resp.data.predios;
    const encontro = predios.filter((item) => item.Lote === anexoBusca);

    // console.log(resp);
    return { ok: true, data: encontro, msg: "encontro" };
  } catch (err) {
    console.log("==============================");
    console.log(err, "Error conectandose a API");

    return { ok: false, data: [], msg: err.response.data.error };
  }
};

const getFechasByPredio = async (id, tipo) => {
  try {
    const instancia = axios.create({
      baseURL: `${process.env.URLBASEVILAB}/fechas/key/${process.env.APIKEYVILAB}/id/${id}/tipo/${tipo}`,
      method: "get",
    });
    const resp = await instancia.get();
    const fechas = resp.data;

    const respuestaFechas = [];
    const erroresFechas = [];
    for (const fecha of fechas.fechas) {
      const indices = await getIndicesByFechaAndPredios(id, fecha.Fecha, 0);

      if (!indices.error) {
        fecha.indices = indices;
        fecha.fallidas = erroresFechas;
        respuestaFechas.push(fecha);

        break;
      } else {
        erroresFechas.push(indices.error);
      }
    }

    // console.log(respuestaFechas);
    return respuestaFechas;
  } catch (err) {
    console.log("==============================");
    console.log(err, "Error conectandose a API");

    return { error: `${err.response.data.error} -- ` };
  }
};

const getIndicesByFechaAndPredios = async (id, fecha, tipo) => {
  try {
    const instancia = axios.create({
      baseURL: `${process.env.URLBASEVILAB}/indice/key/${process.env.APIKEYVILAB}/id/${id}/fecha/${fecha}/tipo/${tipo}`,
      method: "get",
    });
    const resp = await instancia.get();
    const indices = resp.data.indice;

    if (resp.status === 200) {
      return indices;
    }
  } catch (err) {
    console.log("==============================");
    console.log(err.response.data, `Error conectandose a API -- ${fecha}`);
    return {
      error: `${err.response.data.error} -- ${fecha}`,
    };
  }
};

const getAllPredios = async (request, response) => {
  const {
    anexo,
    tipo = 0,
    sistema = "export",
    ambiente = "produccion",
  } = request.query;
  // const anexoBusca = anexo.split("-")[1];
  const anexoBusca = anexo;

  try {
    const encontro = await getPredios(anexoBusca);
    if (!encontro.ok) {
      return response.status(500).json({
        ok: false,
        msg: `${encontro?.msg || "Error generico, contacte a administrador"}`,
        resp: encontro,
        fechas: fechas[0],
      });
    }

    if (encontro.data.length <= 0) {
      return response.status(500).json({
        ok: false,
        msg: `${"No se encontro anexo solicitado"}`,
        resp: null,
        fechas: null,
      });
    }

    const fechas = await getFechasByPredio(encontro.data[0].Id, tipo);

    var buf = Buffer.from(fechas[0].indices[0].Png, "base64");

    const nombreArchivo = `${anexo}_${tipo}_.png`;
    const rutaLocal = `${__dirname}/../uploads/img/${nombreArchivo}`;

    fs.writeFileSync(rutaLocal, buf);

    const client = new ftp.Client();
    // client.ftp.verbose = true

    let ip = "";
    if (ambiente === "pruebas") {
      ip = process.env.SERVER_BD_PRUEBAS;
    } else if (ambiente === "desarrollo") {
      ip = process.env.SERVER_BD;
    } else {
      ip = process.env.IP_PRODUCCION;
    }

    try {
      await client.access({
        host: `${ip}`,
        user: `${
          sistema == "export" ? process.env.USERFTP : process.env.USERFTPVEG
        }`,
        password: `${
          sistema == "export" ? process.env.PASSFTP : process.env.PASSFTPVEG
        }`,
        port: 21,
        secure: false,
      });
    } catch (error) {
      // problemas.push({ ok:false, smg:error })
    }

    // const rutaFtp = (sistema == "export") ? process.env.RUTAFTPPROD:  process.env.RUTAFTPVEGETABLESPROD ;
    const rutaFtp =
      sistema == "export"
        ? `${process.env.RUTAFTP}/${process.env.RUTAVAR}`
        : `${process.env.RUTAFTPVEG}/${process.env.RUTAVARVEG}`;

    const nombreRutaImagenFTP = `${rutaFtp}/${process.env.CARPETAIMGGEOS}/${nombreArchivo}`;

    await client.uploadFrom(`${rutaLocal}`, `${nombreRutaImagenFTP}`);
    const tamano = await client.size(nombreRutaImagenFTP);
    let permissions = 777;

    await client.send(`SITE CHMOD ${permissions} ${nombreRutaImagenFTP}`);

    if (tamano <= 0) {
      // problemas.push({ok:false, msg:"imagen tiff no se subio correctamente."})
      console.log("no se subio a ftp");
    } else {
      fs.rmSync(rutaLocal);
    }

    client.close();

    const nombreBdImagen =
      sistema == "export"
        ? `${process.env.RUTAVAR}`
        : `${process.env.RUTAVARVEG}`;

    fechas[0].indices[0].imageLocal = `${nombreBdImagen}/${process.env.CARPETAIMGGEOS}/${nombreArchivo}`;

    let Anexo;

    if (ambiente === "desarrollo") {
      if (sistema === "export") {
        Anexo = AnexoExport;
      } else {
        Anexo = AnexoVegetable;
      }
    } else if (ambiente === "produccion") {
      if (sistema === "export") {
        Anexo = AnexoExportProd;
      } else {
        Anexo = AnexoVegetableProd;
      }
    } else {
      if (sistema === "export") {
        Anexo = AnexoExportPrueb;
      } else {
        Anexo = AnexoVegetablePrueb;
      }
    }

    let Entity;

    if (ambiente === "desarrollo") {
      if (sistema === "export") {
        Entity = DatoExport;
      } else {
        Entity = DatoVegetable;
      }
    } else if (ambiente === "produccion") {
      if (sistema === "export") {
        Entity = DatoExportProd;
      } else {
        Entity = DatoVegetableProd;
      }
    } else {
      if (sistema === "export") {
        Entity = DatoExportPrueb;
      } else {
        Entity = DatoVegetablePrueb;
      }
    }

    // const updateAnexo  = await Anexo.update()

    await Anexo.update(
      { id_vilab: encontro.data[0].Id },
      { where: { num_anexo: anexo } }
    );

    const fallidas = fechas[0].fallidas;

    var textoFallidas = "";
    for (const fallas of fallidas) {
      textoFallidas += `${fallas}<br>`;
    }
    // console.log(fechas[0].fallidas);

    const datos = await Entity.findAll({
      where: {
        id_vilab: encontro.data[0].Id,
        fecha_imagen_ndvi: fechas[0].Fecha,
      },
    });
    if (datos.length > 0) {
      await Entity.update(
        {
          obs_stats_error: textoFallidas,
          promedio_vilab: fechas[0].indices[0].Promedio,
          ruta_img_vilab: fechas[0].indices[0].imageLocal,
        },
        { where: { id_dato_geos: datos[0].id_dato_geos } }
      );
    } else {
      await Entity.create({
        obs_stats_error: textoFallidas,
        promedio_vilab: fechas[0].indices[0].Promedio,
        ruta_img_vilab: fechas[0].indices[0].imageLocal,
        fecha_imagen_ndvi: fechas[0].Fecha,
        id_vilab: encontro.data[0].Id,
      });
    }
    return response
      .status(200)
      .json({ ok: true, resp: encontro, fechas: fechas[0] });

    // const updateDatos = await Entity.
  } catch (err) {
    console.log("==============================");
    console.log(err, "Error conectandose a API");
    response.status(500).json({ err });
  }
};

module.exports = {
  getAllPredios,
};
