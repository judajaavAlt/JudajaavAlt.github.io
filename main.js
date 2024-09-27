//npx http-server


// Reads the tests file, format it and store it, so it can be used by the algorithms
document.getElementById('form').addEventListener('submit', (event) => 
{
    event.preventDefault();
    const FileReaderObject = new FileReader();
    var data = ''
    //read the file and format it
    FileReaderObject.onload = () => 
    {
        console.log('Processing the file...');
        console.time('File Processing Time');

        //parse the text into an array and get ready to format
        data = FileReaderObject.result;
        document.getElementById('input').innerHTML = data;
        data = data.split("\n")
        var result = [];
        var line = 0;
        var newList = []

        data.forEach(element => {
            if (element.replaceAll(" ", "") != "") newList.push(element.replaceAll(" ", ""))
        });
        
        data = newList
        //check for any social media by looking for its user number and removing white spaces
        var n = parseInt(data[0]);
        if (isNaN(n) || n <= 0)
        {
            throw "error, number of users must be a number greater than zero at line: " + line;
        }
        data.shift();
        line ++
        //look for all the users of the social media
        var i = 0;
        var users = [];
        while (i < n)
        {
            var userAsArray = data[0].split(",");
            if (userAsArray.length != 2)
            {
                throw "error, there was expected an user type at line: " + line;
            }else if (
                isNaN(parseInt(userAsArray[0])) ||
                parseInt(userAsArray[0]) < -100 ||
                parseInt(userAsArray[0]) > 100
            )
            {
                throw "error, user opinion must be a number between -100 and 100 at line: " + line;
            }
            else if (
                isNaN(parseFloat(userAsArray[1])) ||
                parseFloat(userAsArray[1]) < 0 ||
                parseFloat(userAsArray[1]) > 1
            )
            {
                throw "error, user reception must be a number between 0 and 1 at line: " + line;
            }
            else
            {
                users.push([parseInt(userAsArray[0]),parseFloat(userAsArray[1])]);
                data.shift()
                line ++
                i ++;
            }
        }
        //gets the max opinion changes for the social media
        try 
        {
            var R = parseInt(data[0]);
            data.shift();
        }catch {throw "error, there was expected an R_max at line: " + line;}
        //stores each social media in a temporal array
        data = [users, R];   
        //get the function of the algorith that will be used
        const election = document.querySelector('input[name="algorithmType"]:checked').value;

        var selectedAlgorithm; 
        if (election == 'FUERZABRUTA') selectedAlgorithm = modexFB;
        else if (election == 'DINAMICA') selectedAlgorithm = modexPD;
        else if (election == 'VORAZ') selectedAlgorithm = modexV;

        console.log('Calculating results...');
        console.time('Calculation Time');

        //processes the data
        const results = (selectedAlgorithm(data))

        //pass from array to string format
        var file = ""
        file += 'Extremismo: ' + results[0] + '\n'
        file += 'Esfuerzo: ' + results[1] + '\n'
        var moderations = results[2];
        
        for(var i = 0; i < moderations.length; i++)
        {
            file += ((moderations[i] == 0) ? "No se modero" : "Se modero") + '\n'
        }
        file += '\n'
    
        document.getElementById('output').innerHTML = file
        //creates the download
        const downloadTag = document.getElementById('download')
        file = new Blob([file], { type: 'text/plain' });
        downloadTag.href = URL.createObjectURL(file)
        downloadTag.download = "resultado.txt";
        URL.revokeObjectURL(downloadTag.href);
        downloadTag.innerHTML = 'Descargar';

        console.log('Results are ready and file is downloaded.');
        console.timeEnd('File Processing Time');
        console.timeEnd('Calculation Time');
    }

    FileReaderObject.readAsText(document.getElementById('file').files[0]);
})

//create a copy of a social media
function createCopy(AG)
{
    var newAG = []
    AG.forEach(element => {
        newAG.push(element.slice())
    });
    return newAG
}

//process the data in a dinamic way
function modexPD(RS)
{
    const AG = RS[0]
    const R_max = RS[1]
    //create copies of the original socialmedia
    const modifiedAG = createCopy(AG).map((x) => [Math.abs(x[0]), Math.ceil(Math.abs(x[0]) * (1 - x[1]))])
    var sortedmodifiedAG = createCopy(modifiedAG).sort((a,b) => (a[1] - b[1] == 0) ? a[0] - b[0] : a[1] - b[1]).map((x) => [Math.pow(x[0],2),x[1]]);
    //create the table and fill with zeros

    var table = []

    for(var w = 0; w <= sortedmodifiedAG.length; w++)
    {
        table.push(Array(R_max + 1).fill(0));
    }

    //generate a table to find the best combination
    for(var i = 1; i <= sortedmodifiedAG.length; i++)
    {  
        for(var w = 1; w <= R_max; w++)
        {

            const opinion = sortedmodifiedAG[i - 1][0]
            const mod_price = sortedmodifiedAG[i - 1][1]
            
            if (mod_price <= w)
            {
                const value = table[i - 1][w - mod_price] + opinion
                table[i][w] = (value > table[i - 1][w])? value : table[i - 1][w]
            }
            else table[i][w] = table[i - 1][w]
        }
    }

    //define which agents has to be moderated
    i --
    w --
    var agentsToModerate = Array()
    sortedmodifiedAG = sortedmodifiedAG.map((x) => [Math.sqrt(x[0]),x[1]])
    while (i > 0)
    {
        if (table[i - 1][w] != table[i][w])
        {
            agentsToModerate.push(sortedmodifiedAG[i - 1].slice());
            w -= sortedmodifiedAG[i - 1][1] 
        }
        i--
    }
    //creates the moderation technique based on the agents that it has to moderate
    var moderationTechnique = Array(AG.length).fill(0)

    for (i = 0; i < AG.length; i++)
    {
        for(var j = 0; j < agentsToModerate.length; j++)
        {
            if(modifiedAG[i][0] === agentsToModerate[j][0] && modifiedAG[i][1] === agentsToModerate[j][1])
            {
                moderationTechnique[i] = 1
                agentsToModerate[j][0] = 'n'
                break
            }
        }
    }

    //creates the moderated version of the social media
    var moderatedSocialMedia = createCopy(AG)

    for (var index = 0; index < moderatedSocialMedia.length; index++)
    {
        if(moderationTechnique[index] == 1)
        {
            moderatedSocialMedia[index][0] = 0
        }
    }

    //calculates the extremism
    var sumatoryOfExtremism = 0
    
    for (index = 0; index < AG.length; index++)
    {
        sumatoryOfExtremism += Math.pow(moderatedSocialMedia[index][0], 2)
    }

    //const totalExtremism = (Math.sqrt(sumatoryOfExtremism)/moderatedSocialMedia.length) * 1000)/1000
    const totalExtremism = calcularExtremismo(AG, moderationTechnique)
    //calcualtes the effort
    const effort = calcularEsfuerzo(AG, moderationTechnique)

    //returns the results
    return [totalExtremism, effort, moderationTechnique]
}

function modexFB(RS) {
    const AG = RS[0]
    const Rmax = RS[1]
	// Número de agentes
	const n = AG.length

	// variables
	let mejorEstrategia = null
	let minExtremismo = Infinity
	let mejorEsfuerzo = Infinity

	// generar las posibles estrategias de moderación
	for (let i = 0; i < Math.pow(2, n); i++) {
		// Crear posibles estrategias (se va creando una a una)
		const E = i.toString(2).padStart(n, '0').split('').map(Number);

		// calcular el esfuerzo de cada estrategia (estrategia actual)
		const esfuerzo = calcularEsfuerzo(AG, E)

		//validar que el esfuerzo no supere los recursos
		if (esfuerzo <= Rmax) {
			//calcular el extremismo de la estrategia valida
			const extremismo = calcularExtremismo(AG, E)

			// ir guardando la estrategia que tenga el menor extremismo
			if (extremismo < minExtremismo) {
				minExtremismo = extremismo
				mejorEsfuerzo = esfuerzo
				mejorEstrategia = E
			}
		}
	}

	return [minExtremismo, mejorEsfuerzo, mejorEstrategia]
}

// calculo del esfuerzo (RS, E)
function calcularEsfuerzo(AG, E) {
	// valor donde se va a guardar el esfuerzo total
	let esfuerzoTotal = 0

	// calculo del esfuerzo de cada uno de los agentes
	for (let i = 0; i < AG.length; i++) {
		// Verificar si el agente está siendo moderado (E[i] == 1)
		if(E[i] == 1) {
			const [opinion, receptividad] = AG[i]
			esfuerzoTotal += Math.ceil(Math.abs(opinion) * (1 - receptividad))
		}
	}

	return esfuerzoTotal
}

// Calculo del extremismo (RS)
function calcularExtremismo(AG, E) {
	// Número de agentes
	const n = AG.length

	// tener una lista con cada una de las opiniones ya moderadas
	const opinionesModeradas = AG.map((agente, index) => E[index] === 1 ? 0 : agente[0])

	// calculo del extremismo
	const extremismo = Math.sqrt(opinionesModeradas.reduce((acumulador, currentValue) => 
		acumulador + Math.pow(currentValue, 2), 0 )) / n

	return Math.floor(extremismo * 1000)/1000
}

function modexV(RS) {
    const AG = RS[0]
    const R_max = RS[1]
    // Valor de cada agente para decidir su prioridad en la que se va a moderar
    // Ese valor es la relación entre la opinión y el esfuerzo para moderar ese agente
    let importanciaAG = AG.map((agente, index) => {
        const [opinion, receptividad] = agente;

        // Calcular el esfuerzo requerido para moderar este agente
        const esfuerzo = Math.ceil(Math.abs(opinion) * (1 - receptividad));
        
        // Calcular el impacto potencial en el extremismo al moderar este agente
        const impactoExtremismo = Math.pow(opinion, 2) / AG.length;

        // Métrica que combina el impacto en el extremismo y el esfuerzo del agente por el que se va recorriendo
        const importancia = impactoExtremismo / esfuerzo;
        
        return { index, opinion, esfuerzo, importancia };
    });

    // Ordenar a los agentes por orden de importancia (el calculo de antes) de mayor a menor
	importanciaAG.sort((a, b) => {
		// si dos agentes tienen el mismo valor de importancia, se toma el que tenga mayor opinión (mas cercana a 100 o -100)
        if (b.importancia === a.importancia) {
			return Math.abs(b.opinion) - Math.abs(a.opinion);
		}

		return b.importancia - a.importancia;
	});

    let esfuerzoTotal = 0;
    let mejorEstrategia = Array(AG.length).fill(0); // Estrategia inicial sin moderar ningún agente

    // Iterar sobre los agentes en el orden de importancia hasta que el esfuerzo máximo sea alcanzado
    // Se pasa por cada agente en orden de importancia hasta que el esfuerzo sea máximo, es decir, no sobrepase a R_max
    for (let i = 0; i < importanciaAG.length; i++) {
        const { index, esfuerzo } = importanciaAG[i];
        
        // Se verifica si aún se puede moderar el agente sin exceder el esfuerzo máximo
        if (esfuerzoTotal + esfuerzo <= R_max) {
            // Si si se puede moderar, se le suma el esfuerzo y en el array de mejorEstrategia se marca que ese agente fue moderado
            esfuerzoTotal += esfuerzo;
            mejorEstrategia[index] = 1;
        }
    }

    // Calculo del extremismo
        // const extremismo = Math.sqrt(AG.reduce((acumulador, agente, index) =>
        //     acumulador + Math.pow(mejorEstrategia[index] === 1 ? 0 : agente[0], 2), 0)) / AG.length;
    
    // Calculo del extremismo
    const extremismo = calcularExtremismo(AG, mejorEstrategia);

    return [extremismo, esfuerzoTotal, mejorEstrategia];
}