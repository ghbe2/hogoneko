'use strict';
const beforePlantMaterials=bookBackground;
bookBackground=function(node,svg){return beforePlantMaterials(node,svg?PlantMaterials.decorate(svg):svg);};
