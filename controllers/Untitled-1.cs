      private List<RespuestaEOSView> crearImagenNDVI(List<RespuestaEOSEstadisticasResult> listEosView, Cultivo cultivo)
        {
            List<RespuestaEOSView> result = new List<RespuestaEOSView>();
            System.Threading.Thread.Sleep(2500);

            foreach (RespuestaEOSEstadisticasResult eosView in listEosView)
            {


                System.Threading.Thread.Sleep(2500);
                var client = new RestClient("https://gate.eos.com/api/gdw/api?api_key=" + this.apiKey);
                var request = new RestRequest(Method.POST);
                PeticionEOSCreateImage bodyRaw = new PeticionEOSCreateImage();

                System.Diagnostics.Debug.WriteLine(eosView.date);

                string fechaHoy = this.hoy.ToString("yyyy-MM-dd");
                bodyRaw.type = "jpeg";
                bodyRaw.parametros = new ParamsPeticionEOSCreateImage();
                bodyRaw.parametros.view_id = eosView.view_id;
                bodyRaw.parametros.bm_type = "NDVI";
                bodyRaw.parametros.geometry = new Geometry();
                bodyRaw.parametros.geometry = cultivo.geometry;
                bodyRaw.parametros.px_size = 2;
                bodyRaw.parametros.format = "png";
                bodyRaw.parametros.colormap = "2b0040e4100279573a41138c8a30c1f2";
                bodyRaw.parametros.levels = "0,1";
                bodyRaw.parametros.reference = eosView.date;
                request.AddJsonBody(JsonConvert.SerializeObject(bodyRaw).Replace("parametros", "params"));
                IRestResponse response = client.Execute(request);
                var resultado = JsonConvert.DeserializeObject<RespuestaEOSView>(response.Content);
                result.Add(resultado);


            }

            return result;


        }