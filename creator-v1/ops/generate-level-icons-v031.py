from pathlib import Path
import json,html
root=Path('creator-v1');catalog=json.loads((root/'shared/level-artifacts.json').read_text())
# Each artifact has its own silhouette. Shared metalwork unifies the collection.
art=[
'<path d="m128 49 17 51 43 28-47 15-13 59-18-57-42-17 43-25Z"/><path d="m94 61-9-17m78 36 15-12m-7 99 15 12"/>',
'<circle cx="102" cy="99" r="32"/><circle cx="102" cy="99" r="14" fill="var(--deep)"/><path d="m124 121 64 64m-17-17-16 16m0-33-16 16"/>',
'<path d="M128 194C75 171 66 113 94 68c50 10 96 51 34 126Z"/><path d="M128 180V91m0 43-25-22m25 47 24-24"/>',
'<circle cx="128" cy="128" r="63"/><path d="m128 54 17 57 47 17-47 17-17 57-17-57-47-17 47-17Z"/><path d="m128 80 9 41 29 7-29 9-9 39-9-39-29-9 29-7Z" fill="var(--deep)"/>',
'<path d="M118 117C80 45 45 81 75 135l43 11m20-29c38-72 73-36 43 18l-43 11M128 88v93m-10-35-39 30 32 9 17-22 17 22 32-9-39-30M115 78l13 10 13-10"/>',
'<circle cx="128" cy="128" r="61"/><circle cx="128" cy="128" r="44" fill="var(--deep)"/><path d="M128 74v54l31 22M89 89l8 8m70-8-8 8m-62 62-8 8m70-8 8 8"/>',
'<path d="m104 71 48 0 20 20-2 82-18 15h-48l-18-15-2-82Z"/><path d="M104 80v99m48-99v99M85 101h86m-86 53h86m-67-41 48 27m-48 0 48-27"/>',
'<path d="M101 93V75a27 27 0 0 1 54 0v18M86 93h84l-9 88H95Zm4 102h76M110 112l18 48 18-48-18 10Z"/>',
'<path d="m76 71 52 14 52-14-6 88-46 37-46-37Z"/><path d="m90 112 26 8-17 18-9-6m76-20-26 8 17 18 9-6m-31 0-7 20-7-20m-15 35h30" fill="var(--deep)"/>',
'<path d="M98 69c-39 0-39 33 0 33h60c39 0 39 34 0 34H98c-39 0-39 34 0 34h60m0-101h-60m60 101v21" fill="none" stroke-width="14"/><path d="M128 57v140"/>',
'<path d="m80 184 92-114 16-9-4 19-93 112Z"/><ellipse cx="175" cy="76" rx="5" ry="12" transform="rotate(38 175 76)" fill="var(--deep)"/>',
'<path d="M87 158c15-12 14-51 16-59a25 25 0 0 1 50 0c2 8 1 47 16 59Zm-7 9h96m-60 7a12 12 0 0 0 24 0M128 60V45M74 90l-16-9m124 9 16-9"/>',
'<path d="M89 188c10-44-13-124 82-130 20 84-31 102-66 112Z"/><path d="m91 186 66-108m-48 74 43-2m-28-28 39-4m-30-13 25-8"/>',
'<ellipse cx="128" cy="129" rx="66" ry="48" transform="rotate(-25 128 129)"/><ellipse cx="128" cy="129" rx="26" ry="66" transform="rotate(20 128 129)"/><circle cx="128" cy="129" r="42" fill="none"/><path d="M128 51v155M56 129h144"/><circle cx="161" cy="97" r="8"/>',
'<path d="M84 142c-5-63 40-80 75-58l27 14-28 7c-2 46-38 62-68 56l-27 16 6-31Zm27-48 31 32-45 6m9 29-5 28m25-27 8 27"/><circle cx="147" cy="96" r="4" fill="var(--deep)"/>',
'<circle cx="128" cy="128" r="63" fill="none"/><ellipse cx="128" cy="128" rx="24" ry="63" fill="none"/><path d="M65 128h126m-117-28h108m-108 56h108M128 51v154"/>',
'<path d="M127 172c-63-20-65-56-33-67-19-45 25-62 34-28 27-43 57-7 33 19 53 6 38 57-11 60Z"/><path d="M128 114v83m-5-15-30-17m40 11 27-23" fill="none"/>',
'<path d="M101 61v58a27 27 0 0 0 54 0V61m-27 87v48M91 60h20m34 0h20" fill="none" stroke-width="11"/><path d="M74 95H57m125 0h17"/>',
'<path d="M56 128q72-96 144 0-72 96-144 0Z"/><circle cx="128" cy="128" r="33" fill="var(--deep)"/><circle cx="128" cy="128" r="17"/><circle cx="137" cy="118" r="5" fill="white"/>',
'<path d="m75 85 54-29 51 29-1 79-51 33-53-33Z"/><path d="m75 85 53 30 52-30m-52 30v82m-53-33 53-30 51 30m-77-66 25-15 27 15-26 16Z" fill="none"/>',
'<path d="M81 170v-51a47 47 0 0 1 94 0v51l-15-10-16 21-17-16-17 16-16-21Z"/><ellipse cx="110" cy="122" rx="7" ry="13" fill="var(--deep)"/><ellipse cx="146" cy="122" rx="7" ry="13" fill="var(--deep)"/>',
'<path d="M88 65h80m-80 126h80M96 68c0 39 64 81 64 120m0-120c0 39-64 81-64 120" fill="none"/><path d="m104 165 24-23 24 23 6 18H98Z"/><path d="m111 82 17 23 17-23"/>',
'<path d="m110 184 7-92h22l7 92M103 91h50m-45-17 20-22 20 22Z"/><path d="M83 106 58 93m115 13 25-13M88 75 69 58m99 17 19-17M128 41V24" fill="none"/>',
'<path d="m113 64 30 0 6 19 18 10 21-4 15 25-14 15 0 20 12 17-16 23-20-6-17 11-6 18h-29l-6-18-18-11-19 5-15-24 13-15v-21l-13-16 15-24 20 5 18-10Z"/><circle cx="128" cy="137" r="35" fill="var(--deep)"/><circle cx="128" cy="137" r="15"/>',
'<path d="m72 105 25 19 31-57 31 57 25-19-12 73H84Zm18 87h76"/><path d="m128 104 9 22-9 22-9-22Z" fill="var(--deep)"/>',
'<path d="M81 65v120m94-120v120M81 83h94M99 65v48m58-48v48M81 159h94m-61-12v24m14-24v24m14-24v24" fill="none"/><circle cx="128" cy="134" r="8"/>',
'<path d="M93 95c-18-40 28-56 36-22 31-36 57 5 28 24 43 18 23 58-13 47-21 41-64 14-42-18-41 1-44-43-9-31Z"/><path d="M127 103v94m-5-25-27-19m36 29 28-22M72 76l-9-10m119 64 15-3"/>',
'<path d="m76 88 21-22h62l21 22v101H76Z"/><path d="M94 104h68v45H94Zm8-24h52m-59 86h66M107 115h42m-42 13h30" fill="none"/>',
'<ellipse cx="128" cy="129" rx="73" ry="27" transform="rotate(-24 128 129)" fill="none"/><ellipse cx="128" cy="129" rx="30" ry="66" transform="rotate(-24 128 129)" fill="none"/><circle cx="128" cy="129" r="25"/><circle cx="181" cy="103" r="12"/><circle cx="94" cy="76" r="8"/>',
'<path d="M76 65h104v126H76Z"/><path d="m82 72 92 112m0-112L82 184M128 65v126M76 128h104" fill="none"/><circle cx="128" cy="128" r="39" fill="var(--deep)"/><ellipse cx="128" cy="128" rx="17" ry="39" fill="none"/><path d="M89 128h78"/>',
'<path d="m96 74 64 0 20 29-19 76h-66l-19-76Z"/><path d="M95 99h66m-33 0v68m-20-45 20 17 20-17M111 187h34" fill="none"/>',
'<circle cx="99" cy="102" r="31"/><path d="m121 124 59 58 12-12m-21-6-16 16m-7-32-12 12"/><path d="M78 102q21-25 42 0-21 25-42 0Z" fill="var(--deep)"/>',
'<path d="m128 54 18 50 55 5-42 33 13 55-44-31-44 31 13-55-42-33 55-5Z"/><path d="m128 98 10 24 26 2-20 17 6 26-22-15-22 15 6-26-20-17 26-2Z" fill="var(--deep)"/>',
'<path d="M80 65h96v125H80Z"/><path d="M91 80h74M91 176h74m-65-94v91m18-91v91m20-91v91m18-91v91M90 104h76m-76 24h76m-76 24h76" fill="none"/>',
'<ellipse cx="128" cy="131" rx="32" ry="47"/><path d="M100 112 80 96l-18 9m38 28-27 1-13 16m43 6-17 20 0 16m70-80 20-16 18 9m-38 28 27 1 13 16m-43 6 17 20v16M128 85V67m-13 5 13-10 13 10m-13 13v89" fill="none"/>',
'<path d="M128 180C67 151 72 92 101 85l27 16 27-16c29 7 34 66-27 95Z"/><path d="m128 159 0-45 24-17m-24 17-20-17" fill="none"/><circle cx="128" cy="69" r="17"/>',
'<path d="m128 54 45 34-14 78-31 31-31-31-14-78Z"/><path d="m128 78 22 21-6 50-16 20-16-20-6-50Z" fill="var(--deep)"/><path d="M112 44h32m-16 0v13"/>',
'<path d="M90 84h76l-7 78-31 30-31-30Z"/><path d="m128 100-8 29 17 0-10 30m-37-87 14-13h48l14 13" fill="none"/><path d="M70 114H53m133 0h17M80 69 67 56m108 13 14-13"/>',
'<ellipse cx="128" cy="128" rx="65" ry="27" transform="rotate(35 128 128)" fill="none"/><ellipse cx="128" cy="128" rx="65" ry="27" transform="rotate(-35 128 128)" fill="none"/><circle cx="128" cy="128" r="49" fill="none"/><path d="M128 63v130"/><circle cx="128" cy="128" r="15"/>',
'<path d="m83 97 46-39 49 39-9 68-41 34-39-34Z"/><path d="m83 97 45 31 50-31m-50 31 1 71m-40-34 39-37 41 37M129 58v37" fill="none"/>',
'<path d="m77 148 88-80 23 25-88 80Z"/><path d="m99 171-15 28m51-70 17 70m-36-1h58M72 145l-10 11 37 40 13-13M163 62l30 32" fill="none"/>',
'<path d="M96 98h64l-9 77h-46Zm9-12 23-34 23 34M89 186h78m-46-69 7 34 8-34"/><path d="M74 108H51m131 0h23M83 74 66 55m107 19 17-19" fill="none"/>',
'<path d="M94 71 181 175H66Zm2 39-10 48m23-24 24 29m-3-42 28 38M90 64l-8-9m84 101 19 24" fill="none"/><circle cx="99" cy="85" r="11"/>',
'<path d="m126 55 20 34 36 4 14 35-23 29 1 39-37 15-28-26-38 0-14-36 24-29-1-39Z"/><path d="m107 93 42 27-44 34 42 30M92 125l23-9m28 41 23-8" fill="none"/>',
'<path d="M84 69h88l-19 108H103Z"/><path d="m95 82 56 76m-41-76 35 43m-64 62h94M128 188v12m-27 2h54" fill="none"/><path d="M111 81v46m18-46v71m17-71v86"/>',
'<path d="M87 174V86h82v88Z"/><path d="m96 88 16 73 16-73 16 73 16-73M79 184h98m-77-64h57" fill="none"/><path d="m116 68 12-15 12 15"/>',
'<circle cx="128" cy="128" r="61"/><path d="M128 64v128M64 128h128" fill="none"/><path d="m128 78 16 50-16 50-16-50Z" fill="var(--deep)"/><circle cx="128" cy="128" r="10"/>',
'<circle cx="128" cy="128" r="58"/><path d="m128 59 17 40 45 9-32 33 3 47-33-22-33 22 3-47-32-33 45-9Z" fill="var(--deep)"/><path d="M128 75v28m-53 60 26-14m54 0 26 14"/>',
'<path d="M69 190V99l28-25 31 25 31-25 28 25v91Zm34-1V80m50 109V80M128 49v144m-12-57 12-19 12 19m-57-10h8m74 0h8" fill="none"/><path d="M116 172v-19a12 12 0 0 1 24 0v19Z"/>',
'<path d="M80 83h96l-12 81-36 30-36-30Z"/><path d="m108 109 20 46 20-46-20 17Z" fill="var(--deep)"/><path d="M72 75h112M67 113H54m135 0h13M128 56V38m-36 25L78 49m86 14 14-14" fill="none"/>',
'<ellipse cx="128" cy="128" rx="70" ry="30" transform="rotate(-20 128 128)" fill="none"/><circle cx="128" cy="128" r="38"/><path d="M128 59v-13m0 165v-13m-69-70H45m166 0h-14M79 79 68 68m109 109 11 11m-11-109 11-11M79 177l-11 11" fill="none"/><circle cx="187" cy="106" r="10"/>',
'<path d="M128 52v152m-23-13h46M95 88l33-26 33 26m-66 80 33 26 33-26" fill="none"/><ellipse cx="128" cy="128" rx="64" ry="23" fill="none"/><ellipse cx="128" cy="128" rx="43" ry="58" transform="rotate(-25 128 128)" fill="none"/><circle cx="128" cy="128" r="11"/>',
'<path d="M91 183c-34-66 15-115 85-116 1 69-22 116-85 116Z"/><path d="m89 183 70-96m-50 65 38-8m-26-9 38-15m-40-4-4-25" fill="none"/><ellipse cx="128" cy="128" rx="78" ry="24" transform="rotate(22 128 128)" fill="none"/>',
'<path d="m94 157 72-98-13 59 46-40-50 84Z"/><circle cx="106" cy="153" r="34"/><path d="M65 198 91 171m-9 5-24 4m28 10-6 20" fill="none"/>',
'<path d="M102 76h52m-41 0v27c-59 31-52 90 15 90s74-59 15-90V76m-45 54h60M118 62h20" fill="none"/><path d="M100 156q28-19 56 0-28 31-56 0Z"/><path d="M128 138v38"/>',
'<path d="m71 99 30 24 27-62 27 62 30-24-11 80H82Z"/><path d="m128 115 15 24-15 24-15-24Z" fill="var(--deep)"/><path d="M87 191h82m-68-13 0-23m54 23v-23"/>',
'<path d="m98 179 4-102 26-26 27 26 3 102-30 18Z"/><path d="m128 63-13 27 9 19-9 23 14 42 12-38-11-25 12-21Z" fill="var(--deep)"/><path d="M85 81 67 70m104 11 18-11M77 143H56m124 0h20" fill="none"/>',
'<circle cx="128" cy="128" r="58"/><path d="M128 72v55l38-36M85 85l9 9m68-9-9 9m9 68-9-9m-68 9 9-9" fill="none"/><path d="m121 54 7-22 7 22M55 122l-23 6 23 6m146-12 23 6-23 6m-80 67 7 23 7-23"/>',
'<path d="m91 77 37-23 37 23 19 51-19 51-37 23-37-23-19-51Z"/><circle cx="128" cy="128" r="45" fill="var(--deep)"/><path d="m128 87 10 29 31 12-31 10-10 31-11-31-30-10 30-12Z"/><path d="M128 54v20m0 108v20M72 128h12m88 0h12"/>',
'<path d="m128 39 17 57 51-23-29 45 48 26-55 3 12 51-38-33-25 49-6-55-53 11 35-37-43-32 56 5Z"/><path d="m128 80 10 36 33-10-21 27 21 21-34-7-9 32-12-33-29 9 19-24-22-20 33 6Z" fill="var(--deep)"/><circle cx="128" cy="130" r="11" fill="#fff9e5"/>'
]
assert len(art)==60,len(art)
palettes=[('#ecd8c6','#bf8f73','#252137'),('#d9e6f0','#97a9cc','#182840'),('#e8d9ba','#c3a369','#252634'),('#d1ebe0','#8ab7ab','#172e34'),('#e7d7f4','#b397c5','#29213e'),('#fff0c5','#d6ad73','#28233d')]
for i,(entry,motif) in enumerate(zip(catalog,art)):
 light,metal,deep=palettes[i//10];lv=i+1
 ticks=''.join(f'<path d="M128 24v{10 if j%5==0 else 4}" transform="rotate({j*9} 128 128)"/>' for j in range(40))
 # Growing orbit pips distinguish ten ranks within each material chapter.
 pips=''.join(f'<circle cx="128" cy="223" r="2.2" transform="rotate({(j-(i%10)/2)*7} 128 128)"/>' for j in range(i%10+1))
 svg=f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" role="img" aria-labelledby="title" style="--deep:{deep}"><title id="title">Level {lv} · {html.escape(entry['name'])}</title><defs><linearGradient id="rim" x2=".9" y2="1"><stop stop-color="{light}"/><stop offset=".25" stop-color="{metal}"/><stop offset=".48" stop-color="#4b455f"/><stop offset=".7" stop-color="{light}"/><stop offset="1" stop-color="{metal}"/></linearGradient><radialGradient id="enamel" cx=".35" cy=".25" r=".85"><stop stop-color="#45415b"/><stop offset=".65" stop-color="{deep}"/><stop offset="1" stop-color="#0d1323"/></radialGradient><linearGradient id="inlay" x2=".5" y2="1"><stop stop-color="{light}"/><stop offset=".45" stop-color="{metal}"/><stop offset="1" stop-color="#796e91"/></linearGradient></defs><path d="M128 8 156 17 184 20 203 42 225 62 231 92 246 128 231 164 225 194 203 214 184 236 156 239 128 248 100 239 72 236 53 214 31 194 25 164 10 128 25 92 31 62 53 42 72 20 100 17Z" fill="url(#rim)" stroke="{light}" stroke-width="1"/><circle cx="128" cy="128" r="111" fill="url(#enamel)" stroke="#111728" stroke-width="5"/><circle cx="128" cy="128" r="101" fill="none" stroke="url(#rim)" stroke-width="3"/><g stroke="{metal}" stroke-width="1.4" opacity=".7">{ticks}</g><circle cx="128" cy="128" r="85" fill="none" stroke="{metal}" stroke-opacity=".25"/><path d="M48 128h160M128 48v160" stroke="{light}" opacity=".09"/><g fill="url(#inlay)" stroke="{light}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">{motif}</g><path d="M48 102a84 84 0 0 1 105-55" fill="none" stroke="{light}" opacity=".55" stroke-width="2"/><g fill="{light}">{pips}</g></svg>'''
 (root/f'web/public/assets/levels/level-{lv:02}.svg').write_text(svg+'\n')
print('Generated 60 distinct vector artifact emblems.')
