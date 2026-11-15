# Scientific Methodology & Agronomic Rules

> **Project: TerraRota**  
> **NASA Space Apps Challenge 2026 • Challenge: Field Shift**  
> **Document Version: 2.0 (Scientific Specification)**

---

## 1. Philosophical & Methodological Foundation

Agricultural decision support in semi-arid Mediterranean climates cannot rely on black-box probabilistic models or ungrounded Large Language Models. **TerraRota implements a deterministic, multi-criteria agronomic decision model** grounded in peer-reviewed scientific literature from **INRA Maroc**, **ICARDA**, **FAO**, and **UNEP**.

The system answers:
> *"Considering this field's coordinates, multi-year NASA satellite climate history, soil characteristics, previous crops, and available irrigation water, which crop rotation strategies represent the most sustainable and climate-resilient alternatives?"*

---

## 2. Agrometeorological Indicator Formulations

All agrometeorological indicators are computed directly from daily NASA POWER variables:

### 2.1 Growing Degree Days (GDD Base 10°C)
Used to evaluate phenological heat accumulation for crop maturation:
$$GDD_{\text{daily}} = \max\left(0, \frac{T_{2M\_MAX} + T_{2M\_MIN}}{2} - T_{\text{base}}\right)$$
where $T_{\text{base}} = 10.0^\circ\text{C}$ is the standard physiological baseline for cereal and warm-season pulse growth in Morocco. Annual GDD is averaged over the 5-year observation period.

### 2.2 UNEP Aridity Index (AI)
Measures the regional atmospheric water deficit:
$$AI = \frac{P}{PET}$$
Where:
- $P$ is the mean annual precipitation from NASA POWER `PRECTOTCORR` ($mm/\text{year}$).
- $PET$ is the annual Potential Evapotranspiration estimated using the Thornthwaite formulation:
  $$PET \approx 58.93 \times T_{\text{mean}}$$
- **Aridity Classes (UNEP 1992)**:
  - $AI < 0.05$: Hyper-Arid
  - $0.05 \le AI < 0.20$: Arid
  - $0.20 \le AI < 0.50$: Semi-Arid (Dominant zone for Moroccan rainfed agriculture: Chaouia, Abda, Saïss, Haouz)
  - $AI \ge 0.50$: Dry Sub-Humid to Humid

### 2.3 Frost Risk Days
Counts calendar days where:
$$T_{2M\_MIN} < 0.0^\circ\text{C}$$
Used to trigger critical risk warnings for crops sensitive to early winter/spring frost during heading or flowering (e.g., chickpea, almond blossoming, tender tomato foliage).

---

## 3. Two-Tier Decision Architecture

TerraRota separates **Hard Agronomic Constraints (Eligibility)** from **Multi-Criteria Scoring**:

```
                       Candidate Crops (12 Moroccan Species)
                                        │
                                        ▼
                  [STAGE 1: HARD AGRONOMIC CONSTRAINTS]
     ├── Incompatible growing season / water regime?
     ├── Water requirement > rainfall under rainfed regime? (e.g. Tomato < 500mm)
     ├── Endemic ecological boundaries? (e.g. Argan in frost/excess rain)
     └── Critical consecutive family disease penalty?
                                        │
                         Eligible Candidates Only
                                        │
                                        ▼
                  [STAGE 2: EXPLAINABLE MULTI-CRITERIA SCORING]
     Score = Base + NASA Climate Sensitivity + Rotation N-Fixation 
                  + Soil Texture Affinity + Farmer Weighted Priorities
                                        │
                                        ▼
                        Ranked Recommendations & Scenarios
```

### 3.1 Hard Constraints (Eligibility Exclusions)
A candidate crop is strictly excluded (`eligible = False`) when:
1. **Irrigation Imperative**: Vegetable crops (e.g., Tomato) under purely rainfed conditions where annual rainfall $< 500\text{ mm}$ (FAO Irrigation and Drainage Paper 56).
2. **Endemic Boundaries**: Argan tree in areas experiencing significant frost ($> 12\text{ frost days}$) or annual rainfall $> 550\text{ mm}$, where root rot occurs (INRA Agadir).
3. **Potato Water Stress**: Potato under rainfed conditions with rainfall $< 350\text{ mm}$, preventing tuber formation (CIP / FAO ECOCROP).

---

## 4. Scientific Rotation Principles & Biological N-Fixation

The core agronomic differentiator of TerraRota is the **cereal-legume biological rotation**:

### 4.1 Biological Nitrogen Fixation (BNF)
When an exhausted cereal field (`wheat_hard`, `wheat_soft`, `barley`) is rotated into a food legume (`chickpea`, `faba_bean`, `lentil`), the root system establishes a symbiotic relationship with *Rhizobium leguminosarum* bacteria:
- **Faba Bean (`faba_bean`)**: Fixes between $80 \text{ and } 120\text{ kg N/ha}$.
- **Chickpea (`chickpea`)**: Fixes between $40 \text{ and } 80\text{ kg N/ha}$.
- **Lentil (`lentil`)**: Fixes between $35 \text{ and } 70\text{ kg N/ha}$.

**Agronomic Impact**:
- Subsequent cereal grain yields increase by **$20\% \text{ to } 30\%$** without synthetic fertilizer purchase.
- Breaks the lifecycles of soil-borne pathogens: *Fusarium oxysporum*, *Septoria tritici*, and cereal cyst nematodes (*Heterodera avenae*).
- **Source**: *INRA Maroc (Centre Régional de Settat) & ICARDA WANA Technical Bulletin*.

### 4.2 Consecutive Monoculture Penalties
- **Wheat following Wheat**: Penalized by $-25\text{ points}$ with caution on crown rot and root disease buildup.
- **Legume following Legume**: Penalized by $-20\text{ points}$ to prevent Ascochyta blight (*Didymella rabiei*) accumulation.
- **Potato following Tomato**: Caution on Solanaceae soil fatigue and *Phytophthora infestans* transmission.

---

## 5. Farmer Priority Dynamic Re-weighting

TerraRota empowers the farmer to adjust 6 normalized priority weights ($0.0 \text{ to } 1.0$):
1. **Water Conservation**: Boosts drought-hardy crops (Barley, Olive, Argan, Cactus Pear).
2. **Soil Health**: Boosts biological nitrogen fixers (Chickpea, Faba Bean, Lentil).
3. **Profitability**: Boosts high gross-margin market crops (Potato, Drip Tomato, Olive Oil).
4. **Climate Resilience**: Favors rustic crops with high water-use efficiency (WUE).
5. **Crop Diversification**: Penalizes dominant botanical families to diversify farm income.
6. **Risk Minimization**: Favors staple crops with established domestic cooperative market uptake.

$$\text{Final Score} = \text{Base Score} + \sum_{i=1}^{6} w_i \times \text{Affinity}_{i, \text{crop}} \times 20$$
*Scores are mathematically bounded between 20 and 99.*

---

## 6. Scientific Limitations & Ethical Disclaimers

1. **Resolution Scale**: NASA POWER observations ($0.5^\circ \times 0.5^\circ$) represent macro-scale climatological trends. Micro-climates and micro-relief in mountain valleys may deviate.
2. **Provisional Agronomic Models**: Rules are formulated from published INRA and FAO technical manuals but must be validated on-site by a regional agricultural extension officer (*Conseiller agricole de l'ONCA*).
3. **Yield Disclaimers**: TerraRota provides relative suitability rankings; it deliberately refrains from fabricating exact metric yield ($q/ha$) or financial profit projections without certified local soil lab tests.
