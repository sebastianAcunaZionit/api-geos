const { DataTypes, Sequelize } = require("sequelize");
const {
  dbExport,
  dbVegetables,
  dbExportProd,
  dbVegetablesProd,
  dbExportPrueb,
  dbVegetablesPrueb,
} = require("../../database/connection");

const columns = {
  id_ac: {
    type: DataTypes.BIGINT,
    primaryKey: true,
  },
  id_ficha: {
    type: DataTypes.BIGINT,
  },
  num_anexo: {
    type: DataTypes.STRING,
  },
  id_field_eos: {
    type: DataTypes.STRING,
  },
  id_polygon_eos: {
    type: DataTypes.STRING,
  },
  id_vilab: {
    type: DataTypes.BIGINT,
  },
};

const AnexoExportPrueb = dbExportPrueb.define("anexo_contrato", columns, {
  tableName: "anexo_contrato",
  timestamps: false,
});

const AnexoVegetablePrueb = dbVegetablesPrueb.define(
  "anexo_contrato",
  columns,
  {
    tableName: "anexo_contrato",
    timestamps: false,
  }
);

const AnexoExport = dbExport.define("anexo_contrato", columns, {
  tableName: "anexo_contrato",
  timestamps: false,
});

const AnexoVegetable = dbVegetables.define("anexo_contrato", columns, {
  tableName: "anexo_contrato",
  timestamps: false,
});

const AnexoExportProd = dbExportProd.define("anexo_contrato", columns, {
  tableName: "anexo_contrato",
  timestamps: false,
});
const AnexoVegetableProd = dbVegetablesProd.define("anexo_contrato", columns, {
  tableName: "anexo_contrato",
  timestamps: false,
});

module.exports = {
  AnexoExport,
  AnexoVegetable,
  AnexoExportProd,
  AnexoVegetableProd,
  AnexoExportPrueb,
  AnexoVegetablePrueb,
};
