## Multi-Turn Moves in Pokémon: A Deep Dive into Mechanics and Accuracy

Multi-turn moves are a unique and strategic element in the world of Pokémon battles, offering powerful effects that unfold over more than one turn. These moves can be broadly categorized into several groups, each with its own distinct mechanics and methods for determining accuracy. Understanding how these moves work is crucial for any Pokémon trainer looking to gain a competitive edge.

### Two-Turn Moves: Charging and Semi-Invulnerability

Two-turn moves require a turn to prepare or execute before the main effect takes place on the subsequent turn. These are further divided into charging moves and semi-invulnerable moves.

#### Charging Moves

These moves require the user to spend the first turn gathering energy, during which they are typically unable to perform any other action and are vulnerable to attack. The move then unleashes its power on the second turn.

**How they work:**
* **Turn 1:** The Pokémon charges, and a message is displayed (e.g., "[Pokémon] is glowing!"). The user cannot switch out or use another move.
* **Turn 2:** The move executes.

**Accuracy Check:** The accuracy of a charging move is checked on the **second turn**, when the move is about to deal damage. If the move misses, the charging turn is still consumed.

**Implemensb the move below:**

| Move | Type | Power | Accuracy | Effect |
| --- | --- | --- | --- | --- |
| Hyper Beam | Normal | 150 | 90% | The user must recharge on the turn after it hits. |
| Sky Attack | Flying | 140 | 90% | Has a 30% chance of causing the target to flinch. |

#### Semi-Invulnerable Moves

These moves make the user disappear from the field for the first turn, rendering them immune to most attacks. They then strike on the second turn.

**How they work:**
* **Turn 1:** The Pokémon uses the move and becomes semi-invulnerable (e.g., "[Pokémon] flew up high!"). During this time, they cannot be targeted by most moves.
* **Turn 2:** The move deals damage.

**Accuracy Check:** The accuracy for semi-invulnerable moves is also checked on the **second turn**, just before the damage is dealt.

However, a key strategic element of these moves is that certain other moves can still hit a Pokémon in its semi-invulnerable state, often with increased power.

**Notable Examples and Their Counters:**

| Move | Type | Power | Accuracy | Semi-Invulnerable State | Can be hit by |
| --- | --- | --- | --- | --- | --- |
| Fly | Flying | 90 | 95% | In the air | Gust, Hurricane, Sky Uppercut, Smack Down, Thunder, Twister |
| Dig | Ground | 80 | 100% | Underground | Earthquake, Fissure, Magnitude |
| Dive | Water | 80 | 100% | Underwater | Surf, Whirlpool |
| Phantom Force | Ghost | 90 | 100% | Vanished | Can bypass Protect and Detect. |
| Shadow Force | Ghost | 120 | 100% | Vanished | Can bypass Protect and Detect. |

### Moves That Lock the User

These moves force the user to repeatedly use the same attack for a set number of turns. The user is unable to switch out or choose another move during this period.

**How they work:**
* The move is selected and continues to be used for 2-3 turns, or until it is interrupted.
* After the move's duration, the user often becomes confused.

**Accuracy Check:** The accuracy is checked only on the **first turn** the move is used. If it hits, all subsequent hits for the duration of the move will also hit without an accuracy check.

**Notable Examples:**

| Move | Type | Power | Accuracy | Effect |
| --- | --- | --- | --- | --- |
| Outrage | Dragon | 120 | 100% | Lasts for 2-3 turns; confuses the user afterward. |
| Rollout | Rock | 30 | 90% | Lasts for 5 turns; power doubles with each consecutive hit. |

### Multi-Hit Moves

These moves strike the opponent multiple times within a single turn.

**How they work:**
* The move is selected, and it hits the opponent a variable or fixed number of times in the same turn.

**Accuracy Check:** The way accuracy is checked for multi-hit moves varies:

* **Single Accuracy Check:** For most multi-hit moves that hit 2-5 times (e.g., Bullet Seed, Rock Blast, Icicle Spear), there is a **single accuracy check** on the first hit. If the first hit connects, all subsequent hits are guaranteed to land. The number of hits is determined randomly.
* **Per-Hit Accuracy Check:** Some multi-hit moves, most notably **Triple Axel** and **Triple Kick**, have an accuracy check for **each individual hit**. If any of the hits miss, the move's execution stops.
* **Population Bomb**, a unique multi-hit move, also has an accuracy check for each of its potential 10 hits.

**Implements:**

| Move | Type | Power (per hit) | Accuracy | Number of Hits | Accuracy Check |
| --- | --- | --- | --- | --- | --- |
| Double Slap | Normal | 15 | 85% | 2-5 | Single |
| Double Kick | Fighting | 30 | 100% | 2 | Single |
| Population Bomb| Normal | 20 | 90% | 1-10 | Per Hit |

### Trapping Moves

These moves inflict damage over several turns while also preventing the target from switching out.

**How they work:**
* The move hits the target, dealing initial damage.
* For the next 4-5 turns, the target takes a small amount of damage at the end of each turn and cannot be switched out.

**Accuracy Check:** The accuracy of a trapping move is checked when it is **initially used**. If it hits, the trapping and damage-over-time effects are applied for the duration.

**Notable Examples:**

| Move | Type | Power | Accuracy |
| --- | --- | --- | --- |
| Fire Spin | Fire | 35 | 85% |
| Whirlpool | Water | 35 | 85% |
| Sand Tomb | Ground | 35 | 85% |
| Infestation| Bug | 20 | 100% |
| Magma Storm| Fire | 100 | 75% |