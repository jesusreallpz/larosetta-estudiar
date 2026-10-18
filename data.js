/* Datos de la carta de La Rosetta.
   Aquí solo están las pizzas. Si cambia la carta, edita este archivo y nada más.

   Cada pizza es una fila: ["Nombre", "Ingrediente:código", "Ingrediente:código", ...]
   El código es la categoría del ingrediente y decide su color:
     t  tomate               b  nata y cremas
     z  mozzarella           q  otros quesos
     m  carnes y embutidos   v  verduras
     p  pescado y marisco    o  salsas y extras

   Para añadir una pizza, copia una fila dentro de su grupo (romana, napolitana o pinsa).
   Si un ingrediente lleva "a elegir" en el texto, esa pizza se deja fuera del quiz. */

window.ROSETTA_DATA = {
  RAW: {
    romana: [
      ["Barbacoa","Tomate:t","Mozzarella:z","Bacon:m","Carne vacuno:m","Salsa BBQ:o"],
      ["Blanca Malteza","Nata:b","Mozzarella:z","Provolone:q","Carne vacuno:m","Tomate seco:v","Queso cheddar:q"],
      ["Boloñesa","Tomate:t","Mozzarella:z","Carne vacuno:m","Pimiento verde:v","Aceitunas negras:v"],
      ["Bravísima","Tomate:t","Mozzarella:z","Bacon:m","Spianata picante:m","Carne vacuno:m","Queso cheddar:q"],
      ["Caprichosa","Tomate o nata:t","Mozzarella:z","3 ingredientes a elegir:o"],
      ["Carbonara","Nata:b","Mozzarella:z","Bacon:m","Champiñón:v","Cebolla:v"],
      ["Cheddar","Tomate:t","Mozzarella:z","Bacon chips:m","Queso cheddar:q","Cebolla:v"],
      ["Cuatro Estaciones","Tomate:t","Mozzarella:z","Jamón cocido:m","Champiñón:v","Atún:p","Alcachofas:v"],
      ["Cuatro Quesos","Tomate:t","Mozzarella:z","Rulo de cabra:q","Queso gorgonzola:q","Queso cheddar:q"],
      ["Diablo","Tomate:t","Mozzarella:z","Carne vacuno:m","Pollo:m","Salsa sriracha:o","Jalapeños:v"],
      ["Frankfurt","Tomate:t","Mozzarella:z","Bacon:m","Salchichas:m","Parmesano:q"],
      ["Kebab Pollo","Tomate:t","Mozzarella:z","Kebab pollo:m","Cebolla:v","Salsa yogurt:o"],
      ["Mediterráneo","Tomate:t","Mozzarella:z","Atún:p","Gambas:p","Anchoas:p"],
      ["Milano","Tomate:t","Mozzarella:z","Salami Milano:m","Jamón cocido:m","Alcachofas braseadas:v"],
      ["Palermo","Tomate:t","Mozzarella:z","Salami:m","Spianata picante:m","Gorgonzola:q","Cebolla:v"],
      ["Pepperoni","Tomate:t","Mozzarella:z","Spianata picante:m"],
      ["Pollo Braseado","Tomate:t","Mozzarella:z","Pollo:m","Cebolla:v","Aceitunas negras:v"],
      ["Pop Dylan","Nata:b","Mozzarella:z","Palomitas de pollo:m","Queso crema:q","Cebolla caramelizada:v"],
      ["Prosciutto","Tomate:t","Mozzarella:z","Jamón cocido:m"],
      ["Provolone","Tomate:t","Mozzarella:z","Queso provolone:q","Bacon chips:m"],
      ["Rosetta 2.0","Nata:b","Mozzarella:z","Porchetta:m","Mix de setas:v","Parmesano:q"],
      ["Tirolesa","Tomate:t","Mozzarella:z","Jamón curado ahumado:m","A.O.V.E.:o"],
      ["Vegetariana","Tomate:t","Mozzarella:z","Pimiento rojo y verde:v","Champiñón:v","Calabacín:v","Tomate cherry:v"]
    ],
    napolitana: [
      ["Abril","Mortadela Bolonia:m","Burrata:q","Pesto de pistacho:o","Albahaca fresca:v"],
      ["Caprichosa Gourmet","Tomate:t","Crema de calabaza:b","Crema de boletus o nata:b","Mozzarella:z","3 ingredientes a elegir:o"],
      ["Carbonara Tradicional","Crema carbonara:b","Mozzarella:z","Guanciale:m","Parmesano:q"],
      ["Junio","Nata:b","Mozzarella:z","Pera:v","Gorgonzola:q","Nueces:o","Miel:o"],
      ["Margherita","Tomate:t","Mozzarella:z","Albahaca fresca:v","A.O.V.E.:o"],
      ["Marinara","Tomate:t","Ajo laminado:v","Anchoas:p","Orégano:v"],
      ["Miel y Mostaza","Crema de miel y mostaza:b","Mozzarella:z","Pollo:m","Rulo de cabra:q","Cebolla caramelizada:v"],
      ["Noviembre","Crema de boletus:b","Speck ahumado:m","Boletus:v","Crema de queso pecorino:q","Mousse de pato:m"],
      ["Rúcula","Tomate:t","Mozzarella:z","Rúcula:v","Jamón curado:m","Lascas de parmesano:q"],
      ["Trufada","Nata:b","Mozzarella:z","Mortadela Bolonia:m","Pistachos:o","Aceite de trufa blanca:o"],
      ["Venecia","Crema de calabaza:b","Mozzarella:z","Tomate cherry:v","Guanciale:m","Lascas de parmesano:q","Burrata:q"]
    ],
    pinsa: [
      ["Pinsa BBQ 2.0","BBQ cremosa:b","Mozzarella:z","Pulled pork:m","Bacon chips:m","Salsa BBQ:o"],
      ["Pinsa Brava","Mozzarella:z","'Nduja picante:m","Burrata:q","Miel:o","Maíz crujiente:o"],
      ["Pinsa Porchetta","Mozzarella:z","Gorgonzola:q","Alcachofa:v","Porchetta ahumada:m","Crema de trufa:b"]
    ]
  },

  GROUP: { romana: "Romana", napolitana: "Napolitana", pinsa: "Pinsa" },

  CATS: [
    ["t","Tomate"], ["b","Nata y cremas"], ["z","Mozzarella"], ["q","Otros quesos"],
    ["m","Carnes y embutidos"], ["v","Verduras"], ["p","Pescado y marisco"], ["o","Salsas y extras"]
  ],

  /* Ingredientes que en la carta se escriben de dos formas pero son lo mismo.
     En el quiz de escribir, cualquiera de las dos formas cuenta como correcta. */
  ALIAS: [
    ["Queso gorgonzola", "Gorgonzola"],
    ["Queso provolone", "Provolone"],
    ["Alcachofas", "Alcachofa"],
    ["Parmesano", "Lascas de parmesano"]
  ],

  /* Palabras extra con las que se puede buscar un ingrediente al escribirlo */
  SEARCH_EXTRA: {
    "A.O.V.E.": "aceite de oliva virgen extra aove"
  }
};
