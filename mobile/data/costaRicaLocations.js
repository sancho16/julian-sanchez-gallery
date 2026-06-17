// Costa Rica: 7 provinces → cantons → districts
// Coordinates are approximate centers for weather API calls

export const PROVINCES = [
  {
    id: 'SJ', name: 'San José',
    lat: 9.9281, lon: -84.0907,
    cantons: [
      { id: 'SJ-SJ', name: 'San José', lat: 9.9281, lon: -84.0907, districts: ['Carmen','Merced','Hospital','Catedral','Zapote','San Francisco de Dos Ríos','Uruca','Mata Redonda','Pavas','Hatillo','San Sebastián'] },
      { id: 'SJ-ES', name: 'Escazú', lat: 9.9186, lon: -84.1413, districts: ['Escazú','San Antonio','San Rafael'] },
      { id: 'SJ-DE', name: 'Desamparados', lat: 9.8985, lon: -84.0685, districts: ['Desamparados','San Miguel','San Juan de Dios','San Rafael Arriba','San Antonio','Frailes','Patarrá','San Cristóbal','Rosario','Damas','San Rafael Abajo','Gravilias','Los Guido'] },
      { id: 'SJ-PU', name: 'Puriscal', lat: 9.8456, lon: -84.3224, districts: ['Santiago','Mercedes Sur','Barbacoas','Grifo Alto','San Rafael','Candelarita','Desamparaditos','San Antonio','Chires'] },
      { id: 'SJ-TA', name: 'Tarrazú', lat: 9.6731, lon: -84.0786, districts: ['San Marcos','San Lorenzo','San Carlos'] },
      { id: 'SJ-AS', name: 'Aserrí', lat: 9.8597, lon: -84.0986, districts: ['Aserrí','Tarbaca','Vuelta de Jorco','San Gabriel','La Legua','Monterrey','Salitrillos'] },
      { id: 'SJ-MO', name: 'Mora', lat: 9.8819, lon: -84.2305, districts: ['Ciudad Colón','Guayabo','Tabarcia','Piedras Negras','Picagres','Jaris','Quitirrisí'] },
      { id: 'SJ-GO', name: 'Goicoechea', lat: 9.9594, lon: -84.0380, districts: ['Guadalupe','San Francisco','Calle Blancos','Mata de Plátano','Ipís','Rancho Redondo','Purral'] },
      { id: 'SJ-SC', name: 'Santa Ana', lat: 9.9319, lon: -84.1858, districts: ['Santa Ana','Salitral','Piedades','Brasil','Santiago','Uruca','Pozos'] },
      { id: 'SJ-AL', name: 'Alajuelita', lat: 9.8913, lon: -84.1028, districts: ['Alajuelita','San Josecito','San Antonio','Concepción','San Felipe'] },
      { id: 'SJ-VH', name: 'Vásquez de Coronado', lat: 9.9942, lon: -84.0275, districts: ['San Isidro','San Rafael','Dulce Nombre de Jesús','Patalillo','Cascajal'] },
      { id: 'SJ-AC', name: 'Acosta', lat: 9.7722, lon: -84.1941, districts: ['San Ignacio','Guaitil','Palmichal','Cangrejal','Sabanillas'] },
      { id: 'SJ-TI', name: 'Tibás', lat: 9.9608, lon: -84.0819, districts: ['San Juan','Cinco Esquinas','Anselmo Llorente','León XIII','Colima'] },
      { id: 'SJ-MO2', name: 'Moravia', lat: 9.9742, lon: -84.0469, districts: ['San Vicente','San Jerónimo','La Trinidad'] },
      { id: 'SJ-MO3', name: 'Montes de Oca', lat: 9.9358, lon: -84.0488, districts: ['San Pedro','Sabanilla','Mercedes','San Rafael'] },
      { id: 'SJ-TR', name: 'Turrubares', lat: 9.8136, lon: -84.4336, districts: ['San Pablo','San Pedro','San Juan de Mata','San Luis','Carara'] },
      { id: 'SJ-DA', name: 'Dota', lat: 9.6547, lon: -83.9555, districts: ['Santa María','Jardín','Copey'] },
      { id: 'SJ-CU', name: 'Curridabat', lat: 9.9177, lon: -84.0291, districts: ['Curridabat','Granadilla','Sánchez','Tirrases'] },
      { id: 'SJ-PM', name: 'Pérez Zeledón', lat: 9.3647, lon: -83.6986, districts: ['San Isidro del General','El General','Daniel Flores','Rivas','San Pedro','Platanares','Pejibaye','Cajón','Barú','Río Nuevo','Páramo','La Amistad'] },
      { id: 'SJ-LU', name: 'León Cortés Castro', lat: 9.7480, lon: -84.0610, districts: ['San Pablo','San Andrés','Llano Bonito','San Isidro','Santa Cruz','San Antonio'] },
    ]
  },
  {
    id: 'AL', name: 'Alajuela',
    lat: 10.0159, lon: -84.2141,
    cantons: [
      { id: 'AL-AL', name: 'Alajuela', lat: 10.0159, lon: -84.2141, districts: ['Alajuela','San José','Carrizal','San Antonio','Guácima','San Isidro','Sarapiquí','La Garita','San Rafael','Río Segundo','Desamparados','Turrúcares','Tambor','Garita','Sabanilla'] },
      { id: 'AL-SJ', name: 'San Ramón', lat: 10.0900, lon: -84.4700, districts: ['San Ramón','Santiago','San Juan','Piedades Norte','Piedades Sur','San Rafael','San Isidro','Angeles','Alfaro','Volio','Concepción','Zapotal','Peñas Blancas','San Lorenzo'] },
      { id: 'AL-GR', name: 'Grecia', lat: 10.0669, lon: -84.3177, districts: ['Grecia','San Isidro','San José','San Roque','Tacares','Río Cuarto','Puente de Piedra','Bolívar'] },
      { id: 'AL-SA', name: 'San Mateo', lat: 9.9472, lon: -84.5130, districts: ['San Mateo','Desmonte','Jesús María','Labrador'] },
      { id: 'AL-AT', name: 'Atenas', lat: 9.9777, lon: -84.3780, districts: ['Atenas','Jesús','Mercedes','San Isidro','Concepción','San José','Santa Eulalia','Escobal'] },
      { id: 'AL-NA', name: 'Naranjo', lat: 10.1007, lon: -84.3927, districts: ['Naranjo','San Miguel','San José','Cirrí Sur','San Jerónimo','San Juan','El Rosario','Palmitos'] },
      { id: 'AL-PA', name: 'Palmares', lat: 10.0594, lon: -84.4363, districts: ['Palmares','Zaragoza','Buenos Aires','Santiago','Candelaria','Esquipulas','La Granja'] },
      { id: 'AL-PO', name: 'Poás', lat: 10.1144, lon: -84.2352, districts: ['San Juan','San Luis','Carrillos','Sabana Redonda','Cedral'] },
      { id: 'AL-OC', name: 'Orotina', lat: 9.9063, lon: -84.5258, districts: ['Orotina','El Mastate','Hacienda Vieja','Coyolar','La Ceiba'] },
      { id: 'AL-SC', name: 'San Carlos', lat: 10.3300, lon: -84.5100, districts: ['Quesada','Florencia','Buenavista','Aguas Zarcas','Venecia','Pital','La Fortuna','La Tigra','La Palmera','Venado','Cutris','Monterrey','Pocosol'] },
      { id: 'AL-ZA', name: 'Zarcero', lat: 10.1847, lon: -84.3977, districts: ['Zarcero','Laguna','Tapesco','Guadalupe','Palmira','Zapote','Brisas'] },
      { id: 'AL-VA', name: 'Valverde Vega', lat: 10.1622, lon: -84.3530, districts: ['Sarchí Norte','Sarchí Sur','Toro Amarillo','San Pedro','Rodríguez'] },
      { id: 'AL-UP', name: 'Upala', lat: 10.8960, lon: -85.0130, districts: ['Upala','Aguas Claras','San José','Bijagua','Delicias','Dos Ríos','Yolillal','Canalete'] },
      { id: 'AL-LC', name: 'Los Chiles', lat: 11.0330, lon: -84.7200, districts: ['Los Chiles','Caño Negro','El Amparo','San Jorge'] },
      { id: 'AL-GU', name: 'Guatuso', lat: 10.6730, lon: -84.8440, districts: ['San Rafael','Buenavista','Cote','Katira'] },
      { id: 'AL-RC', name: 'Río Cuarto', lat: 10.5680, lon: -84.2160, districts: ['Río Cuarto','Santa Rita','Santa Isabel'] },
    ]
  },
  {
    id: 'CA', name: 'Cartago',
    lat: 9.8640, lon: -83.9193,
    cantons: [
      { id: 'CA-CA', name: 'Cartago', lat: 9.8640, lon: -83.9193, districts: ['Oriental','Occidental','Carmen','San Nicolás','Aguacaliente','Guadalupe','Corralillo','Tierra Blanca','Dulce Nombre','Llano Grande','Quebradilla'] },
      { id: 'CA-PA', name: 'Paraíso', lat: 9.8352, lon: -83.8647, districts: ['Paraíso','Santiago','Orosi','Cachí','Llanos de Santa Lucía'] },
      { id: 'CA-LU', name: 'La Unión', lat: 9.9102, lon: -83.9919, districts: ['Tres Ríos','San Diego','San Juan','San Rafael','Concepción','Dulce Nombre','San Ramón','Río Azul'] },
      { id: 'CA-JI', name: 'Jiménez', lat: 9.7938, lon: -83.7427, districts: ['Juan Viñas','Tucurrique','Pejibaye'] },
      { id: 'CA-TR', name: 'Turrialba', lat: 9.9000, lon: -83.6800, districts: ['Turrialba','La Suiza','Peralta','Santa Cruz','Santa Teresita','Pavones','Tuis','Tayutic','Santa Rosa','Tres Equis','La Isabel','Chirripó'] },
      { id: 'CA-AL', name: 'Alvarado', lat: 9.9672, lon: -83.8447, districts: ['Pacayas','Cervantes','Capellades'] },
      { id: 'CA-OC', name: 'Oreamuno', lat: 9.9580, lon: -83.8830, districts: ['San Rafael','Cot','Potrero Cerrado','Cipreses','Santa Rosa'] },
      { id: 'CA-EL', name: 'El Guarco', lat: 9.8208, lon: -83.9944, districts: ['El Tejar','San Isidro','Tobosi','Patio de Agua'] },
    ]
  },
  {
    id: 'HE', name: 'Heredia',
    lat: 9.9986, lon: -84.1168,
    cantons: [
      { id: 'HE-HE', name: 'Heredia', lat: 9.9986, lon: -84.1168, districts: ['Heredia','Mercedes','San Francisco','Ulloa','Varablanca'] },
      { id: 'HE-BA', name: 'Barva', lat: 10.0302, lon: -84.1127, districts: ['Barva','San Pedro','San Pablo','San Roque','Santa Lucía','San José de la Montaña'] },
      { id: 'HE-SO', name: 'Santo Domingo', lat: 9.9769, lon: -84.0888, districts: ['Santo Domingo','San Vicente','San Miguel','Paracito','Santo Tomás','Santa Rosa','Tures','Pará'] },
      { id: 'HE-SA', name: 'Santa Bárbara', lat: 10.0458, lon: -84.1541, districts: ['Santa Bárbara','San Pedro','San Juan','Jesús','Santo Domingo','Puraba'] },
      { id: 'HE-SJ', name: 'San Rafael', lat: 10.0477, lon: -84.0841, districts: ['San Rafael','San Josecito','Santiago','Ángeles','Concepción'] },
      { id: 'HE-SP', name: 'San Isidro', lat: 10.0058, lon: -84.0763, districts: ['San Isidro','San José','Concepción','San Francisco'] },
      { id: 'HE-BE', name: 'Belén', lat: 9.9802, lon: -84.1852, districts: ['San Antonio','La Ribera','La Asunción'] },
      { id: 'HE-FL', name: 'Flores', lat: 9.9963, lon: -84.1636, districts: ['San Joaquín','Barrantes','Llorente'] },
      { id: 'HE-SC', name: 'San Pablo', lat: 10.0027, lon: -84.1030, districts: ['San Pablo','Rincón de Sabanilla'] },
      { id: 'HE-SA2', name: 'Sarapiquí', lat: 10.4819, lon: -83.9958, districts: ['Puerto Viejo','La Virgen','Las Horquetas','Llanuras del Gaspar','Cureña'] },
    ]
  },
  {
    id: 'GU', name: 'Guanacaste',
    lat: 10.6272, lon: -85.4438,
    cantons: [
      { id: 'GU-LI', name: 'Liberia', lat: 10.6272, lon: -85.4438, districts: ['Liberia','Cañas Dulces','Mayorga','Nacascolo','Curubandé'] },
      { id: 'GU-NI', name: 'Nicoya', lat: 10.1497, lon: -85.4524, districts: ['Nicoya','Mansión','San Antonio','Quebrada Honda','Sámara','Nosara','Belén de Nosarita'] },
      { id: 'GU-SA', name: 'Santa Cruz', lat: 10.2666, lon: -85.5863, districts: ['Santa Cruz','Bolsón','Veintisiete de Abril','Tempate','Cartagena','Cuajiniquil','Diriá','Cabo Velas','Tamarindo'] },
      { id: 'GU-BA', name: 'Bagaces', lat: 10.5263, lon: -85.2568, districts: ['Bagaces','La Fortuna','Mogote','Río Naranjo'] },
      { id: 'GU-CA', name: 'Carrillo', lat: 10.4494, lon: -85.5169, districts: ['Filadelfia','Palmira','Sardinal','Belén'] },
      { id: 'GU-CA2', name: 'Cañas', lat: 10.4244, lon: -85.0933, districts: ['Cañas','Palmira','San Miguel','Bebedero','Porozal'] },
      { id: 'GU-AB', name: 'Abangares', lat: 10.2711, lon: -84.9961, districts: ['Las Juntas','Sierra','San Juan','Colorado'] },
      { id: 'GU-TI', name: 'Tilarán', lat: 10.4697, lon: -84.9780, districts: ['Tilarán','Quebraда Grande','San Pedro','Tilawa','Arenal','Libano','Tronadora'] },
      { id: 'GU-NA', name: 'Nandayure', lat: 9.9869, lon: -85.2047, districts: ['Carmona','Santa Rita','Zapote','San Pablo','Porvenir','Bejuco'] },
      { id: 'GU-LC', name: 'La Cruz', lat: 11.0724, lon: -85.6302, districts: ['La Cruz','Santa Cecilia','La Garita','Santa Elena'] },
      { id: 'GU-HO', name: 'Hojancha', lat: 10.0788, lon: -85.3994, districts: ['Hojancha','Monte Romo','Puerto Carrillo','Huacas','Matambú'] },
    ]
  },
  {
    id: 'PU', name: 'Puntarenas',
    lat: 9.9763, lon: -84.8308,
    cantons: [
      { id: 'PU-PU', name: 'Puntarenas', lat: 9.9763, lon: -84.8308, districts: ['Puntarenas','Pitahaya','Chomes','Lepanto','Paquera','Manzanillo','Guacimal','Barranca','Isla del Coco','Cóbano','Chacarita','Chira','Acapulco','El Roble','Arancibia'] },
      { id: 'PU-ES', name: 'Esparza', lat: 9.9950, lon: -84.6694, districts: ['Espíritu Santo','San Juan Grande','Macacona','San Rafael','San Jerónimo','Caldera'] },
      { id: 'PU-BU', name: 'Buenos Aires', lat: 9.1713, lon: -83.3303, districts: ['Buenos Aires','Volcán','Potrero Grande','Boruca','Pilas','Colinas','Chánguena','Biolley','Brunka'] },
      { id: 'PU-MO', name: 'Montes de Oro', lat: 10.0955, lon: -84.6727, districts: ['Miramar','La Unión','San Isidro'] },
      { id: 'PU-OS', name: 'Osa', lat: 8.9169, lon: -83.5138, districts: ['Puerto Cortés','Palmar','Sierpe','Bahía Ballena','Piedras Blancas','Bahía Drake'] },
      { id: 'PU-QP', name: 'Quepos', lat: 9.4314, lon: -84.1630, districts: ['Quepos','Savegre','Naranjito'] },
      { id: 'PU-GO', name: 'Golfito', lat: 8.6380, lon: -83.1820, districts: ['Golfito','Puerto Jiménez','Guaycará','Pavón'] },
      { id: 'PU-CC', name: 'Coto Brus', lat: 8.9730, lon: -82.9690, districts: ['San Vito','Sabalito','Aguabuena','Limoncito','Pittier','Gutiérrez Braun'] },
      { id: 'PU-PA', name: 'Parrita', lat: 9.5205, lon: -84.3324, districts: ['Parrita'] },
      { id: 'PU-CR', name: 'Corredores', lat: 8.5380, lon: -83.0330, districts: ['Corredor','La Cuesta','Canoas','Laurel'] },
      { id: 'PU-GA', name: 'Garabito', lat: 9.5802, lon: -84.6527, districts: ['Jacó','Tárcoles'] },
    ]
  },
  {
    id: 'LI', name: 'Limón',
    lat: 9.9908, lon: -83.0363,
    cantons: [
      { id: 'LI-LI', name: 'Limón', lat: 9.9908, lon: -83.0363, districts: ['Limón','Valle La Estrella','Río Blanco','Matama'] },
      { id: 'LI-PO', name: 'Pococí', lat: 10.2933, lon: -83.6808, districts: ['Guápiles','Jiménez','Rita','Roxana','Cariari','Colorado','La Colonia'] },
      { id: 'LI-SQ', name: 'Siquirres', lat: 10.1000, lon: -83.5100, districts: ['Siquirres','Pacuarito','Florida','Germania','Cairo','Alegría','Reventazón'] },
      { id: 'LI-TA', name: 'Talamanca', lat: 9.5730, lon: -82.9210, districts: ['Bratsi','Sixaola','Cahuita','Telire'] },
      { id: 'LI-MA', name: 'Matina', lat: 10.0757, lon: -83.3011, districts: ['Matina','Batán','Carrandi'] },
      { id: 'LI-GU', name: 'Guácimo', lat: 10.2100, lon: -83.6900, districts: ['Guácimo','Mercedes','Pocora','Río Jiménez','Duacarí'] },
    ]
  },
];

export function getProvince(id) {
  return PROVINCES.find(p => p.id === id);
}

export function getCanton(provinceId, cantonId) {
  const province = getProvince(provinceId);
  return province?.cantons.find(c => c.id === cantonId);
}
