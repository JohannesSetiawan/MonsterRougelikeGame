Implements weather system fot both backend and frontend. For frontend, just need to implements marking in BattleInterface about what weather is applied. Don't show any weather marking if there's no weather applied. 

The available weather and its effect is as follow:

1. Harsh sunlight - The harsh sunlight weather condition. It boosts the power of Fire-type moves and lowers the power of Water-type moves.	Harsh sunlight strengthens the power of Fire-type moves by 50% and weakens the power of Water-type moves by 50%. During harsh sunlight, no Monster can be frozen.

2. Rain - The rain weather condition. It boosts the power of Water-type moves and lowers the power of Fire-type moves. Rain strengthens Water-type moves by 50% while weakening Fire-type moves by 50%.

3. Sandstorm - The sandstorm weather condition. At the end of each turn, it damages all Monster that are not Rock, Ground, or Steel types. It boosts the Sp. Def of Rock-type Monster by 1 stage. Any Monster that is not Rock-, Ground-, or Steel-type will be damaged for 1/16 of its maximum HP at the end of each turn. 

4. Hail - The hail weather condition. At the end of each turn, it damages all Monster that are not Ice types.	Any Monster that is not Ice-type will be damaged for 1/16 of its maximum HP at the end of each turn. Boosts the Defense of Ice-type Monster by 1 stage.

5. Fog - A thick fog clouds the overworld and battlefield, reducing the accuracy of all moves by 20%.

6. Strong winds - The strong winds weather condition. The power of moves that are super effective against Flying-type Monster is decreased.	Strong winds causes Electric-, Ice-, and Rock-type moves to deal neutral damage to Flying-type Monster.