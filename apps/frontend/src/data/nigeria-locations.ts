// Nigerian States and their Local Government Areas (LGAs)
export interface NigeriaLocation {
  state: string
  lgas: string[]
}

export const NIGERIA_STATES_LGAS: NigeriaLocation[] = [
  {
    state: 'Lagos',
    lgas: [
      'Agege', 'Ajeromi-Ifelodun', 'Alimosho', 'Amuwo-Odofin', 'Apapa',
      'Badagry', 'Epe', 'Eti Osa', 'Ibeju-Lekki', 'Ifako-Ijaiye',
      'Ikeja', 'Ikorodu', 'Kosofe', 'Lagos Island', 'Lagos Mainland',
      'Mushin', 'Ojo', 'Oshodi-Isolo', 'Shomolu', 'Surulere'
    ]
  },
  {
    state: 'FCT',
    lgas: [
      'Abaji', 'Bwari', 'Gwagwalada', 'Kuje', 'Kwali', 'Municipal'
    ]
  },
  {
    state: 'Kano',
    lgas: [
      'Ajingi', 'Albasu', 'Bagwai', 'Bebeji', 'Bichi', 'Bunkure',
      'Dala', 'Dambatta', 'Dawakin Kudu', 'Dawakin Tofa', 'Doguwa',
      'Fagge', 'Gabasawa', 'Garko', 'Garun Mallam', 'Gaya', 'Gezawa',
      'Gwale', 'Gwarzo', 'Kabo', 'Kano Municipal', 'Karaye', 'Kibiya',
      'Kiru', 'Kumbotso', 'Kunchi', 'Kura', 'Madobi', 'Makoda',
      'Minjibir', 'Nassarawa', 'Rano', 'Rimin Gado', 'Rogo', 'Shanono',
      'Sumaila', 'Takai', 'Tarauni', 'Tofa', 'Tsanyawa', 'Tudun Wada',
      'Ungogo', 'Warawa', 'Wudil'
    ]
  },
  {
    state: 'Rivers',
    lgas: [
      'Abua/Odual', 'Ahoada East', 'Ahoada West', 'Akuku-Toru', 'Andoni',
      'Asari-Toru', 'Bonny', 'Degema', 'Eleme', 'Emohua', 'Etche',
      'Gokana', 'Ikwerre', 'Khana', 'Obio/Akpor', 'Ogba/Egbema/Ndoni',
      'Ogu/Bolo', 'Okrika', 'Omuma', 'Opobo/Nkoro', 'Oyigbo',
      'Port Harcourt', 'Tai'
    ]
  },
  {
    state: 'Oyo',
    lgas: [
      'Afijio', 'Akinyele', 'Atiba', 'Atisbo', 'Egbeda', 'Ibadan North',
      'Ibadan North-East', 'Ibadan North-West', 'Ibadan South-East',
      'Ibadan South-West', 'Ibarapa Central', 'Ibarapa East', 'Ibarapa North',
      'Ido', 'Irepo', 'Iseyin', 'Itesiwaju', 'Iwajowa', 'Kajola',
      'Lagelu', 'Ogbomosho North', 'Ogbomosho South', 'Ogo Oluwa',
      'Olorunsogo', 'Oluyole', 'Ona Ara', 'Orelope', 'Ori Ire',
      'Oyo East', 'Oyo West', 'Saki East', 'Saki West', 'Surulere'
    ]
  },
  {
    state: 'Enugu',
    lgas: [
      'Aninri', 'Awgu', 'Enugu East', 'Enugu North', 'Enugu South',
      'Ezeagu', 'Igbo Etiti', 'Igbo Eze North', 'Igbo Eze South',
      'Isi Uzo', 'Nkanu East', 'Nkanu West', 'Nsukka', 'Oji River',
      'Udenu', 'Udi', 'Uzo Uwani'
    ]
  },
  {
    state: 'Abia',
    lgas: [
      'Aba North', 'Aba South', 'Arochukwu', 'Bende', 'Ikwuano',
      'Isiala Ngwa North', 'Isiala Ngwa South', 'Isuikwuato', 'Obi Ngwa',
      'Ohafia', 'Osisioma', 'Ugwunagbo', 'Ukwa East', 'Ukwa West',
      'Umuahia North', 'Umuahia South', 'Umu Nneochi'
    ]
  },
  {
    state: 'Adamawa',
    lgas: [
      'Demsa', 'Fufure', 'Ganye', 'Gayuk', 'Gombi', 'Grie', 'Hong',
      'Jada', 'Lamurde', 'Madagali', 'Maiha', 'Mayo Belwa', 'Michika',
      'Mubi North', 'Mubi South', 'Numan', 'Shelleng', 'Song',
      'Toungo', 'Yola North', 'Yola South'
    ]
  },
  {
    state: 'Akwa Ibom',
    lgas: [
      'Abak', 'Eastern Obolo', 'Eket', 'Esit Eket', 'Essien Udim',
      'Etim Ekpo', 'Etinan', 'Ibeno', 'Ibesikpo Asutan', 'Ibiono-Ibom',
      'Ika', 'Ikono', 'Ikot Abasi', 'Ikot Ekpene', 'Ini', 'Itu',
      'Mbo', 'Mkpat-Enin', 'Nsit-Atai', 'Nsit-Ibom', 'Nsit-Ubium',
      'Obot Akara', 'Okobo', 'Onna', 'Oron', 'Oruk Anam', 'Udung-Uko',
      'Ukanafun', 'Uruan', 'Urue-Offong/Oruko', 'Uyo'
    ]
  },
  {
    state: 'Anambra',
    lgas: [
      'Aguata', 'Anambra East', 'Anambra West', 'Anaocha', 'Awka North',
      'Awka South', 'Ayamelum', 'Dunukofia', 'Ekwusigo', 'Idemili North',
      'Idemili South', 'Ihiala', 'Njikoka', 'Nnewi North', 'Nnewi South',
      'Ogbaru', 'Onitsha North', 'Onitsha South', 'Orumba North',
      'Orumba South', 'Oyi'
    ]
  },
  {
    state: 'Bauchi',
    lgas: [
      'Alkaleri', 'Bauchi', 'Bogoro', 'Damban', 'Darazo', 'Dass',
      'Gamawa', 'Ganjuwa', 'Giade', 'Itas/Gadau', 'Jama\'are', 'Katagum',
      'Kirfi', 'Misau', 'Ningi', 'Shira', 'Tafawa Balewa', 'Toro',
      'Warji', 'Zaki'
    ]
  }
]

// Get all unique states
export const getAllStates = (): string[] => {
  return NIGERIA_STATES_LGAS.map(location => location.state)
}

// Get LGAs for a specific state
export const getLGAsForState = (state: string): string[] => {
  const location = NIGERIA_STATES_LGAS.find(
    loc => loc.state.toLowerCase() === state.toLowerCase()
  )
  return location?.lgas || []
}

// Get states that have centers (based on our 7 centers)
export const STATES_WITH_CENTERS = ['Lagos', 'FCT', 'Kano', 'Rivers', 'Oyo', 'Enugu']
