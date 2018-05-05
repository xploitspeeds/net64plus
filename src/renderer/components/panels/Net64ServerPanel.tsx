import './Net64ServerPanel.scss'

import * as React from 'react'
import { Dispatch } from 'redux'
import { connect } from 'react-redux'
import { shell } from 'electron'
import * as marked from 'marked'
import { emojify } from 'node-emoji'

import { connector } from '../..'
import { SMMButton } from '../buttons/SMMButton'
import { WarningPanel } from '../panels/WarningPanel'
import { disconnect } from '../../actions/connection'
import { State } from '../../../models/State.model'
import { Server } from '../../../models/Server.model'
import { IPlayer, GameModeType } from '../../../../proto/ServerClientMessage'

interface Net64ServerPanelProps {
  dispatch: Dispatch<State>
  server: Server
  username: string
  characterId: number
  connectionError: string
  onConnect?: () => void
  isConnected?: boolean
}

interface Net64ServerPanelState {
  display: boolean
  displayDescription: boolean
  warning: string
}

const CHARACTER_IMAGES = [
  'mario.png', 'luigi.png', 'yoshi.png', 'wario.png', 'peach.png', 'toad.png', 'waluigi.png', 'rosalina.png', 'sonic.png', 'knuckles.png', 'goomba.png', 'kirby.png'
]

class Panel extends React.PureComponent<Net64ServerPanelProps, Net64ServerPanelState> {
  constructor (public props: Net64ServerPanelProps) {
    super(props)
    this.state = {
      display: !!props.isConnected,
      displayDescription: true,
      warning: ''
    }
    this.onToggle = this.onToggle.bind(this)
    this.handleDescriptionToggle = this.handleDescriptionToggle.bind(this)
    this.onConnect = this.onConnect.bind(this)
    this.onDisconnect = this.onDisconnect.bind(this)
    this.renderPlayers = this.renderPlayers.bind(this)
  }
  getDescription = () => {
    if (!this.props.server.description) return ''
    let description = emojify(marked(this.props.server.description))
    const document: Document = new DOMParser().parseFromString(description, 'text/html')
    const links: NodeListOf<HTMLElement> = document.querySelectorAll('.markdown a')
    for (let i = 0; i < links.length; i++) {
      const href = links[i].getAttribute('href')
      links[i].removeAttribute('href')
      links[i].onclick = () => {
        if (!href) return
        shell.openExternal(href)
      }
    }
    description = document.body.outerHTML
    return description
  }
  onToggle () {
    if (this.props.isConnected) return
    this.setState(prevState => ({
      display: !prevState.display
    }))
  }
  handleDescriptionToggle () {
    this.setState(prevState => ({
      displayDescription: !prevState.displayDescription
    }))
  }
  onConnect () {
    if (this.props.onConnect) this.props.onConnect()
    const server = this.props.server
    connector.createConnection({
      domain: server.domain,
      ip: server.ip,
      port: server.port,
      username: this.props.username,
      characterId: this.props.characterId
    })
  }
  onDisconnect () {
    this.props.dispatch(disconnect())
    connector.disconnect()
  }
  renderPlayers (players: IPlayer[]) {
    return players
      .filter(player => player)
      .map(
        (player, index) =>
          <div
            key={index}
            className='net64-server-panel-player'
          >
            <div className='net64-server-panel-player-img'>
              <img src={`img/${CHARACTER_IMAGES[player.characterId || 0]}`} />
            </div>
            <div>
              { player.username }
            </div>
          </div>
      )
  }
  private getGameMode (server: Server): string {
    switch (server.gameMode) {
      case GameModeType.DEFAULT:
        return 'Regular'
      case GameModeType.INTERACTIONLESS:
        return 'Interactionless'
      case GameModeType.THIRD_PERSON_SHOOTER:
        return '3rd Person Shooter'
      case GameModeType.PROP_HUNT:
        return 'Prop Hunt'
      case GameModeType.TAG:
        return 'Tag'
      case GameModeType.BOSS_RUSH:
        return 'Boss Rush'
      case GameModeType.WARIO_WARE:
        return 'Wario Ware'
    }
    return ''
  }
  private getGameModeImgSrc (server: Server): string | undefined {
    switch (server.gameMode) {
      case GameModeType.DEFAULT:
        return 'img/regular.svg'
      case GameModeType.INTERACTIONLESS:
        return 'img/interactionless.svg'
      case GameModeType.THIRD_PERSON_SHOOTER:
        return 'img/shooter.svg'
      case GameModeType.PROP_HUNT:
        return 'img/prop_hunt.svg'
      case GameModeType.TAG:
        return 'img/tag.svg'
      case GameModeType.BOSS_RUSH:
        return 'img/boss_rush.png'
      case GameModeType.WARIO_WARE:
        return 'img/wario_ware.png'
    }
  }
  render () {
    const { server, isConnected } = this.props
    const { display, displayDescription, warning } = this.state
    const players = server.players || []
    let gameMode: string | undefined = this.getGameModeImgSrc(server)
    const styles: React.CSSProperties = {
      name: {
        flex: '1 1 auto',
        wordWrap: 'break-word',
        maxWidth: 'calc(100% - 110px)'
      },
      players: {
        whiteSpace: 'nowrap',
        flex: '0 0 70px',
        textAlign: 'right'
      },
      details: {
        display: display ? 'flex' : 'none',
        margin: '4px 10px 0 10px',
        width: 'calc(100% - 20px)',
        backgroundColor: 'rgba(255,255,255,0.3)',
        borderRadius: '0 0 10px 10px',
        flexWrap: 'wrap'
      },
      left: {
        display: 'flex',
        minWidth: displayDescription ? '300px' : undefined,
        width: displayDescription ? '50%' : undefined,
        wordWrap: 'break-word'
      },
      right: {
        display: 'flex',
        flexDirection: 'column',
        flexWrap: 'wrap',
        alignItems: 'stretch',
        flex: '1 0 auto',
        padding: '6px',
        width: '50%',
        minWidth: '300px',
        maxHeight: '340px',
        overflow: 'hidden'
      },
      el: {
        margin: '6px'
      }
    }
    return (
      <div className='net64-server-panel'>
        <div
          className='net64-server-panel-header'
          onClick={this.onToggle}
        >
          <div style={{ flex: '0 0 40px' }}>
            { server.countryCode || '' }
          </div>
          {
            gameMode &&
            <div className='net64-server-panel-header-gamemode'>
              <img src={gameMode} />
            </div>
          }
          <div style={styles.name}>
            { server.name || `${server.ip}:${server.port}` }
          </div>
          <div style={styles.players}>
            { players.filter(player => player).length } / 24
          </div>
        </div>
        <div style={styles.details}>
          {
            warning &&
            <WarningPanel warning={warning} />
          }
          <div style={styles.left}>
            <div
              className={`net64-server-panel-description-toggle${!displayDescription ? ' net64-server-panel-description-toggle-inactive' : ''}`}
              onClick={this.handleDescriptionToggle}
            >
              <img src='img/arrow.svg' style={{ width: '100%' }} />
            </div>
            <div
              className={`net64-server-panel-description${!displayDescription ? ' net64-server-panel-description-inactive' : ''}`}
            >
              <div style={styles.el}>
                { server.domain || server.ip }:{ server.port }
              </div>
              {
                gameMode &&
                <div
                  className='net64-server-panel-gamemode'
                  style={styles.el}
                >
                  Game Mode: { this.getGameMode(server) }
                </div>
              }
              <div
                className='markdown'
                style={styles.el}
                dangerouslySetInnerHTML={{ __html: this.getDescription() }}
              />
            </div>
          </div>
          <div style={styles.right}>
            {
              this.renderPlayers(players)
            }
          </div>
          <div style={{width: '100%'}}>
            {
              isConnected
                ? <SMMButton
                  text='Disconnect'
                  iconSrc='img/net64.svg'
                  onClick={this.onDisconnect}
                />
                : <SMMButton
                  text='Connect'
                  iconSrc='img/net64.svg'
                  onClick={this.onConnect}
                />
            }
          </div>
        </div>
      </div>
    )
  }
}
export const Net64ServerPanel = connect((state: State) => ({
  username: state.save.appSaveData.username,
  characterId: state.save.appSaveData.character,
  connectionError: state.connection.error
}))(Panel)
