// Справочник «Капитала» (уровни и награды) — собирается из тех же данных и компонентов,
// что и приложение. Запуск: npm run wiki → docs/kapital-wiki.pdf
import { writeFileSync } from 'node:fs'
import { renderToStaticMarkup } from 'react-dom/server'
import { it } from 'vitest'
import { Icon } from '../../components/Icon'
import { LevelBadge } from '../../components/LevelBadge'
import { LogoMark } from '../../components/LogoMark'
import { money } from '../format'
import { LEVELS } from '../levels'
import { GROUPS, TIER_NAMES, achievements, type Tier } from '../achievements'
import { initialData } from '../../store'

const TIERS: Record<Tier, [string, string]> = {
  bronze: ['#e7a56b', '#8a4b22'],
  silver: ['#f1f5f9', '#8796ad'],
  gold: ['#fde047', '#d97706'],
  diamond: ['#a5f3fc', '#6366f1'],
}

function Wiki() {
  const all = achievements(initialData(), '2026-01-01')
  const open = all.filter((a) => !a.secret)
  const secret = all.filter((a) => a.secret)
  const AchRow = ({ a }: { a: (typeof all)[number] }) => (
    <div className="ach">
      <span className="ach-icon" style={{ background: `linear-gradient(135deg, ${TIERS[a.tier][0]}, ${TIERS[a.tier][1]})` }}>
        <Icon name={a.icon} size={15} strokeWidth={2.2} />
      </span>
      <span className="ach-text">
        <b>{a.title}</b>
        <small>{a.hint}</small>
      </span>
      <span className="tier" style={{ color: TIERS[a.tier][0] }}>
        {TIER_NAMES[a.tier]}
      </span>
    </div>
  )
  return (
    <main>
      <header>
        <LogoMark size={40} />
        <div>
          <h1>Капитал — справочник</h1>
          <p>
            Все уровни и награды: {LEVELS.length} ступеней и {all.length} наград, из них {secret.length} секретных
          </p>
        </div>
      </header>

      <section className="rules">
        <div>
          <b>Уровень</b> считается по доходу за последние 7 дней (включая сегодня) и может как расти, так и снижаться.
        </div>
        <div>
          <b>Награды</b> выдаются навсегда — даже если показатель потом снизился.
        </div>
        <div>
          <b>Цвет значка награды</b> показывает её редкость: от бронзы до бриллианта.
        </div>
      </section>

      <h2>Лестница уровней</h2>
      <section className="levels">
        {LEVELS.map((l) => (
          <div key={l.index} className="level">
            <LevelBadge level={l} size={46} />
            <span className="level-text">
              <b>
                {l.index}. {l.name}
              </b>
              <small>{l.min === 0 ? `до ${money(LEVELS[1].min)}` : `от ${money(l.min)}`} за 7 дней</small>
              <span className="colors">
                <i style={{ background: l.from }} />
                <i style={{ background: l.to }} />
                <em>
                  {l.from.toUpperCase()} → {l.to.toUpperCase()}
                </em>
              </span>
            </span>
          </div>
        ))}
      </section>

      <h2>Редкость наград</h2>
      <section className="tiers">
        {(Object.keys(TIERS) as Tier[]).map((t) => (
          <div key={t} className="tier-chip">
            <span className="ach-icon" style={{ background: `linear-gradient(135deg, ${TIERS[t][0]}, ${TIERS[t][1]})` }} />
            <b>{TIER_NAMES[t]}</b>
            <small>
              {all.filter((a) => a.tier === t).length} наград · {TIERS[t][0].toUpperCase()} → {TIERS[t][1].toUpperCase()}
            </small>
          </div>
        ))}
      </section>

      <h2>Награды</h2>
      <section className="groups">
        {GROUPS.filter((g) => g !== 'Секретные').map((g) => (
          <div key={g} className="group">
            <h3>
              {g} <span>{open.filter((a) => a.group === g).length}</span>
            </h3>
            {open
              .filter((a) => a.group === g)
              .map((a) => (
                <AchRow key={a.id} a={a} />
              ))}
          </div>
        ))}
      </section>

      <h2 className="spoiler">Секретные награды · спойлер</h2>
      <p className="note">В приложении они скрыты под замком, пока не откроются сами.</p>
      <section className="secret">
        {secret.map((a) => (
          <AchRow key={a.id} a={a} />
        ))}
      </section>
    </main>
  )
}

const CSS = `
*{box-sizing:border-box;margin:0}
body{background:#071430;color:#eef4ff;font-family:-apple-system,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:11px;line-height:1.3;-webkit-print-color-adjust:exact;print-color-adjust:exact}
main{width:794px;padding:28px 30px 30px;background:radial-gradient(120% 40% at 50% 0%,#1f4f97,transparent 60%),#071430}
header{display:flex;align-items:center;gap:14px;margin-bottom:14px}
h1{font-size:24px;letter-spacing:-.02em}
header p{color:#8ea4c7;font-size:12px}
h2{font-size:15px;margin:18px 0 8px;letter-spacing:-.01em}
h2.spoiler{color:#fde047}
.note{color:#8ea4c7;margin:-4px 0 8px}
.rules{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.rules div,.level,.tier-chip,.group,.secret{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:12px}
.rules div{padding:8px 10px;color:#c9d8f0}
.rules b{color:#fff}
.levels{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}
.level{display:flex;align-items:center;gap:8px;padding:6px 8px}
.level-text{display:flex;flex-direction:column;min-width:0}
.level-text b{font-size:11.5px}
.level-text small{color:#8ea4c7;font-size:10px}
.colors{display:flex;align-items:center;gap:3px;margin-top:2px}
.colors i{width:9px;height:9px;border-radius:50%;display:inline-block;border:1px solid rgba(255,255,255,.25)}
.colors em{font-style:normal;color:#8ea4c7;font-size:8.5px;margin-left:2px;font-variant-numeric:tabular-nums}
.badge{position:relative;flex-shrink:0;display:grid;place-items:center}
.badge>svg{position:absolute;inset:0}
.badge-icon{position:relative;z-index:1;color:#fff;display:grid;place-items:center}
.badge-num{display:none}
.tiers{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}
.tier-chip{display:grid;grid-template-columns:auto 1fr;column-gap:8px;align-items:center;padding:7px 9px}
.tier-chip .ach-icon{grid-row:span 2}
.tier-chip small{color:#8ea4c7;font-size:9px}
.groups{columns:2;column-gap:8px}
.group{break-inside:avoid;padding:8px 9px 4px;margin-bottom:8px}
.group h3{font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:#c9d8f0;margin-bottom:5px;display:flex;justify-content:space-between}
.group h3 span{color:#8ea4c7}
.ach{display:flex;align-items:center;gap:7px;padding:3px 0;border-top:1px solid rgba(255,255,255,.05)}
.group h3+.ach{border-top:0}
.ach-icon{width:24px;height:24px;border-radius:50%;display:grid;place-items:center;color:#1b1405;flex-shrink:0}
.ach-text{flex:1;display:flex;flex-direction:column;min-width:0}
.ach-text b{font-size:10.5px}
.ach-text small{color:#8ea4c7;font-size:9.5px}
.tier{font-size:8px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;white-space:nowrap}
.secret{display:grid;grid-template-columns:repeat(2,1fr);column-gap:14px;padding:6px 10px;border-color:rgba(253,224,71,.35)}
.secret .ach{border-top:0}
`

it('справочник', () => {
  const out = process.env.WIKI_OUT
  if (!out) return
  writeFileSync(out, `<!doctype html><html lang="ru"><head><meta charset="utf-8"><title>Капитал — справочник</title><style>${CSS}</style></head><body>${renderToStaticMarkup(<Wiki />)}</body></html>`)
})
