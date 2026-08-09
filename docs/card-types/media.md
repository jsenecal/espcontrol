---
title: Media Cards
description:
  How to use media cards on your EspControl panel to control Home Assistant media player entities.
---

# Media

A Media card controls a Home Assistant `media_player` entity. It can work as a simple playback button, a volume control, a track position control, a now-playing display, or a cover-art tile.

![Wide media card showing now-playing title and artist](/images/card-media.png)

## Setting Up a Media Card

1. Select a card and change its type to **Media**.
2. Choose the media **Type**:
   - **All Controls**
   - **Speaker Group**
   - **Play/Pause Button**
   - **Previous Button**
   - **Next Button**
   - **Volume Button**
   - **Track Position**
   - **Now Playing**
   - **Cover Art**
   - **Media Content**
3. Enter the media player entity, for example `media_player.living_room`.
4. Set a label or icon if the selected type shows those fields.

If Home Assistant reports the media player as unavailable, the card keeps its normal appearance. A card set to show the live state can still say **Unavailable**, and controls will work again when Home Assistant can accept actions for the player.

## Playback Buttons

**Play/Pause Button**, **Previous Button**, and **Next Button** send the matching Home Assistant media player action when tapped.

For Play/Pause, you can choose whether the card shows its fixed label or the live state, such as **Playing** or **Paused**.

## Volume Button

The Volume Button shows the current volume percentage. Tapping it opens a volume control popup on the panel, where you can adjust the volume without leaving the current page.

For media players that support setting an exact volume, the popup dial is draggable. Some integrations, including Android TV Remote, only support volume-up and volume-down commands. For those players, the dial remains a live volume indicator and the **−** and **+** buttons adjust the volume one device-defined step at a time.

Set **Maximum Volume** to cap the panel control below 100%. The popup dial rescales to that maximum, so a 40% cap makes 40% the end of the arc.

For step-only players, the maximum is best-effort because the device decides the size of each volume step. EspControl disables further volume-up commands once Home Assistant reports that the configured maximum has been reached.

The card watches the media player's `volume_level` attribute, so it also updates when volume changes elsewhere.

## Track Position

Track Position shows playback progress and elapsed time.

- Drag the progress bar to seek within the current track.
- The card uses Home Assistant's `media_duration`, `media_position`, and `media_position_updated_at` attributes when they are available.
- You can show a fixed label or the live playback state.

Seeking depends on the media player integration. Some players expose progress but do not support seeking.

## Now Playing

Now Playing shows the media title and artist from Home Assistant. For TV or Line-in sources that do not provide artist data, the artist line shows **Source** instead of reusing the previous track's artist.

You can choose optional controls:

- **None** shows only the current title and artist.
- **Track Position** adds a progress background and lets you seek.
- **Play/Pause** makes the card tappable so it toggles playback.

Now Playing works best on wider or larger cards because it has more room for track text.

## Cover Art

Cover Art shows the current artwork reported by the selected media player. Choose a square card size: **1x1**, **2x2**, or **3x3**. EspControl crops the image to fill the tile without stretching it.

If the main player is a soundbar or speaker that reports an external `TV`, `Line-in`, or `HDMI` source, you can set **External Source Media Entity** to the connected player, such as an Apple TV. While that external source is active, the card takes its artwork, track details, progress, and controls from the connected player. If the connected player is unavailable or has no current media, the card hides cached artwork and shows the main player's source instead. It switches back to the main player automatically for normal playback.

Enable **Show Track Details** to place the current title and artist over the artwork. EspControl adds an artwork-derived dark tint so the text remains readable. If artwork is unavailable, the title and artist remain visible on the card's normal background. The setting is off by default, so existing Cover Art cards remain image-only.

Tapping Cover Art always opens the full **All Controls** popup.

Cover Art uses one of the display's shared image download slots. If all slots are already used by image or cover-art cards, remove one before adding another. Artwork availability and update speed depend on the media player integration and the `entity_picture` information it supplies to Home Assistant.

## All Controls

All Controls opens playback controls and volume in a popup. The parent card uses the play/pause icon, and can show either its fixed label or the current media player state. Its top-left area can show either the icon or the current volume number.

When the main player reports Home Assistant's grouping capability and speaker discovery returns at least one valid player, All Controls includes a fourth **Speakers** tab. By default, EspControl reads the compatible-speaker inventory from `sensor.speaker_group`. If that sensor is missing or empty, the tab stays hidden instead of showing an unusable list.

When Home Assistant reports that the media player supports both power-on and power-off actions, the popup also includes a Power tab. Media players without both capabilities do not show the tab.

## Speaker Groups

Speaker Group opens the speaker panel directly, without the playback, progress, and single-player volume tabs. It lets you join and unjoin compatible speakers and control the volume of speakers that are currently grouped.

### Before You Start

Speaker grouping needs at least two speakers from a platform that supports Home Assistant's `media_player.join` and `media_player.unjoin` actions. Common compatible platforms include Sonos, Google Cast, HEOS, Yamaha MusicCast, LinkPlay, Bluesound, and Bang & Olufsen. Music Assistant may also work, depending on the player provider.

First, try joining the same speakers in Home Assistant. Home Assistant can reject a request to join speakers from different platforms, such as a Sonos speaker and a Google Cast speaker.

The panel must also be allowed to run `media_player.join`, `media_player.unjoin`, and `media_player.volume_set`; see [Enable Actions](/getting-started/home-assistant-actions).

### Create the Speaker Discovery Sensor

EspControl needs a Home Assistant template sensor that supplies the list of speakers, their names, availability, and current volumes. Add one of the templates below to `configuration.yaml`, then restart Home Assistant so it can load the new template.

#### Standard Integrations

Use this for Sonos, Google Cast, HEOS, Yamaha MusicCast, LinkPlay, Bluesound, Bang & Olufsen, and similar integrations. Replace both instances of `sonos` with the integration name for your speakers. For example, Google Cast uses `cast` and HEOS uses `heos`.

```yaml
template:
  - sensor:
      - name: "Speaker Group"
        unique_id: speaker_group
        state: >
          {%- set s = integration_entities("sonos") | select("match", "media_player") | list -%}
          {{ s | count }}
        attributes:
          data: >
            {%- set s = integration_entities("sonos") | select("match", "media_player") | list -%}
            {%- set ns = namespace(items=[]) -%}
            {%- for entity_id in s -%}
              {%- set available = states(entity_id) not in ["unknown", "unavailable"] -%}
              {%- set ns.items = ns.items + [[entity_id, state_attr(entity_id, "friendly_name") or entity_id, state_attr(entity_id, "volume_level"), available]] -%}
            {%- endfor -%}
            v2|{{ ns.items | to_json }}
```

#### Music Assistant 2.8 and Later

Music Assistant 2.8 combines players that support multiple protocols into one entity. Use this template to list its media players. Only include players that can be grouped together; remove providers or entities that your Music Assistant setup cannot join.

```yaml
template:
  - sensor:
      - name: "Speaker Group"
        unique_id: speaker_group
        state: >
          {%- set s = integration_entities("music_assistant") | select("match", "media_player") | list -%}
          {{ s | count }}
        attributes:
          data: >
            {%- set s = integration_entities("music_assistant") | select("match", "media_player") | list -%}
            {%- set ns = namespace(items=[]) -%}
            {%- for entity_id in s -%}
              {%- set available = states(entity_id) not in ["unknown", "unavailable"] -%}
              {%- set ns.items = ns.items + [[entity_id, state_attr(entity_id, "friendly_name") or entity_id, state_attr(entity_id, "volume_level"), available]] -%}
            {%- endfor -%}
            v2|{{ ns.items | to_json }}
```

#### Music Assistant 2.7 and Earlier

Older Music Assistant versions can expose group and sync-group entities as well as individual speakers. This version excludes those virtual group entities so the panel shows only physical players.

```yaml
template:
  - sensor:
      - name: "Speaker Group"
        unique_id: speaker_group
        state: >
          {%- set s = integration_entities("music_assistant")
              | select("match", "media_player")
              | reject("is_state_attr", "mass_player_type", "group")
              | reject("is_state_attr", "mass_player_type", "sync_group")
              | list -%}
          {{ s | count }}
        attributes:
          data: >
            {%- set s = integration_entities("music_assistant")
                | select("match", "media_player")
                | reject("is_state_attr", "mass_player_type", "group")
                | reject("is_state_attr", "mass_player_type", "sync_group")
                | list -%}
            {%- set ns = namespace(items=[]) -%}
            {%- for entity_id in s -%}
              {%- set available = states(entity_id) not in ["unknown", "unavailable"] -%}
              {%- set ns.items = ns.items + [[entity_id, state_attr(entity_id, "friendly_name") or entity_id, state_attr(entity_id, "volume_level"), available]] -%}
            {%- endfor -%}
            v2|{{ ns.items | to_json }}
```

### Verify the Sensor

After Home Assistant restarts, open **Developer Tools** > **States** and search for `sensor.speaker_group`. Its state should be the number of speakers found, and its `data` attribute should list the speaker names. If it is missing, check the YAML indentation. If its state is `0`, check that the integration name matches Home Assistant and that it has `media_player` entities.

The versioned JSON format above is recommended because speaker names can safely contain commas and it reports availability explicitly. The earlier comma-separated ESPHome Media Player format remains supported for existing installations.

### Add the Card in EspControl

1. Select a card and change its type to **Media**.
2. Choose **Speaker Group** as the media type.
3. Enter the main speaker entity, for example `media_player.living_room`.
4. Leave **Speaker Discovery Entity** empty to use `sensor.speaker_group`, or enter a different discovery sensor if you created one.
5. Save the card.

You can also use **All Controls**. When the selected player supports grouping and the discovery sensor has speakers, its popup includes a **Speakers** tab.

The main speaker is always selected. Selecting another speaker sends `media_player.join` with the complete selected group; clearing one sends `media_player.unjoin` to that speaker. A row shows a pending state while Home Assistant handles the request. If an integration rejects an incompatible request, the selection is restored and the panel shows an error.

The optional **Speaker Discovery Entity** card setting can point to another compatible discovery sensor. A Home Assistant media-player Group helper can provide a manually maintained list for joining and removing speakers, but it exposes only entity IDs. Group and per-speaker volume controls therefore require the discovery sensor format above, which also supplies each member's volume.

### Group and Individual Volume

Individual volume controls appear only for speakers in a multi-speaker group. While grouped, the main Volume tab shows **Group** and its arc represents the arithmetic mean of the available members' current levels. Moving it applies the same difference to each speaker instead of making every speaker equally loud.

For example, `10%`, `25%`, and `40%` has a group level of `25%`. Moving Group Volume to `35%` sends `20%`, `35%`, and `50%`. Each result is limited to `0%` and the card's **Maximum Volume** setting. Group Volume remains disabled until every available member has reported a volume, which avoids losing the existing balance.

### Troubleshooting and Device Testing

- If the **Speakers** tab does not appear, check that `sensor.speaker_group` exists and its `data` attribute is not empty.
- If a speaker does not appear, make sure it is a `media_player` from the integration named in the template and is not unavailable.
- If adding a speaker fails, try the same join in Home Assistant first. The speakers may not be compatible, or the integration may not support grouping.
- If the panel can show speakers but cannot change them, check the panel's Home Assistant action permissions.
- If volume controls are missing, join at least one other speaker and check that each group member reports a `volume_level` value.
- Change membership and volume in Home Assistant and confirm the panel updates.
- Reconnect or restart a speaker and confirm its state returns without reopening the card.

## Media Content

Media Content is a shortcut for anything Home Assistant can play with the `media_player.play_media` action. It is not tied to Spotify, Music Assistant, Plex, Jellyfin, Sonos, or any other specific music system.

Use it for playlists, radio stations, albums, saved favorites, channels, podcasts, or other playable media items.

Enter:

- **Speaker Entity** - the Home Assistant `media_player` that should play the media, for example `media_player.living_room`.
- **Source** - choose the source preset, such as **Spotify**, **Apple Music**, **YouTube Music**, **Plex**, **Jellyfin**, **Home Assistant Media Source**, or **Custom / full URI**.
- **Media Type** - choose the type Home Assistant expects, such as `playlist`, `music`, `album`, `track`, or `channel`. Use **Custom** if your integration needs a different value.
- **ID** - enter only the playlist, station, album, track, or favorite ID when using a source preset. Use **Custom / full URI** if your integration needs the full media content ID exactly as Home Assistant shows it.
- **Label** - the name shown on the button, for example `Morning Playlist`.
- **Icon** - the icon shown on the button.

EspControl sends the media content type as `playlist` automatically. The important part is that the media content ID works in Home Assistant first.

When Home Assistant reports the currently playing `media_content_id`, the Playlist Button highlights only while that configured playlist or media item is playing. Some integrations do not report this value reliably; in that case EspControl can start the playlist, but it may not be able to confirm that the specific playlist is active.

### Find the Media Content ID

The easiest way is to test the media item in Home Assistant first, then copy the working values into EspControl.

1. In Home Assistant, open **Media** from the sidebar.
2. Browse to the playlist, station, album, or favorite you want to play.
3. Play it once from Home Assistant to confirm the speaker and media source work.
4. Open **Developer Tools**.
5. Open the **Actions** tab.
6. Choose the action **Media player: Play media**.
7. Select the same speaker entity you want EspControl to use.
8. Enter the media content ID you want to test and use `playlist` as the media content type.
9. Press **Perform action**.
10. If the speaker starts the right media, copy those same values into EspControl.

The YAML view in Home Assistant will look similar to this:

```yaml
action: media_player.play_media
target:
  entity_id: media_player.living_room
data:
  media_content_id: "spotify:playlist:1LG2Lnt9EDQS1DqoE8E2uO"
  media_content_type: "playlist"
```

In EspControl, that becomes:

| Home Assistant value | EspControl field |
| --- | --- |
| `entity_id: media_player.living_room` | **Speaker Entity** |
| `media_content_id: "spotify:playlist:1LG2Lnt9EDQS1DqoE8E2uO"` | **Source:** Spotify, **Media Type:** Playlist, **ID:** `1LG2Lnt9EDQS1DqoE8E2uO` |
| `media_content_type: "playlist"` | **Media Type:** Playlist |

If the value does not match one of the source presets, choose **Custom / full URI** and paste the full `media_content_id` into **ID**.

### If You Do Not Know the ID Format

Different Home Assistant integrations use different ID formats. There is no single format that works for every music system.

Common examples look like this:

| System or source | Source | ID | Media Type |
| --- | --- | --- | --- |
| Spotify playlist | Spotify | `1LG2Lnt9EDQS1DqoE8E2uO` | `playlist` |
| Spotify track | Spotify | `0KIhLAkHfL9fvgn0yy1qsU` | `music` or `track` |
| Home Assistant media source | Home Assistant Media Source | `media_source/local/Morning.mp3` | `music` |
| Integration favorite | Custom / full URI | `favorite_id_or_uri` | often `music`, `playlist`, or `favorite` |

These examples are starting points only. The value that matters is the one your Home Assistant integration accepts when you test `media_player.play_media`.

### Using a Shared Playlist URL

Many music services give you a web sharing URL. EspControl usually needs the media ID or URI, not the full website URL.

For example, this Spotify playlist URL:

```text
https://open.spotify.com/playlist/1LG2Lnt9EDQS1DqoE8E2uO?si=1Jho2boIRDGE4PQ9Q0COXA
```

contains this playlist ID:

```text
1LG2Lnt9EDQS1DqoE8E2uO
```

For Spotify, the Home Assistant media content ID is commonly:

```text
spotify:playlist:1LG2Lnt9EDQS1DqoE8E2uO
```

In EspControl, choose **Spotify**, choose **Playlist**, and paste only this ID into **ID**:

```text
1LG2Lnt9EDQS1DqoE8E2uO
```

The same idea applies to other services: copy the playlist, album, station, or favorite ID from the shared URL, then turn it into the URI format your Home Assistant integration expects.

Examples:

| Shared link or ID | Source | Media Type | ID |
| --- | --- | --- | --- |
| `https://open.spotify.com/playlist/1LG2Lnt9EDQS1DqoE8E2uO?si=...` | Spotify | Playlist | `1LG2Lnt9EDQS1DqoE8E2uO` |
| `https://open.spotify.com/track/0KIhLAkHfL9fvgn0yy1qsU?si=...` | Spotify | Track | `0KIhLAkHfL9fvgn0yy1qsU` |

Always test the result in Home Assistant first:

```yaml
action: media_player.play_media
target:
  entity_id: media_player.living_room
data:
  media_content_id: "spotify:playlist:1LG2Lnt9EDQS1DqoE8E2uO"
  media_content_type: "playlist"
```

If the Home Assistant test starts the right playlist, use the same `media_content_id` in EspControl.

### Troubleshooting

If tapping the Media Content button does not start playback:

- Make sure the button has an **ID**. EspControl requires this before saving.
- Test the same values with `media_player.play_media` in Home Assistant.
- Check that the selected **Speaker Entity** can play that source from Home Assistant.
- Try a different **Media Type**. Some integrations use `playlist`, while others use `music`, `album`, `track`, `channel`, or a custom value.
- If your integration gives you a full sharing URL, convert it to the ID or URI format that Home Assistant expects.
- If the preset source builds the wrong value for your integration, choose **Custom / full URI** and paste the exact `media_content_id` that works in Home Assistant.
- If the button starts the playlist but does not stay highlighted, check whether the media player entity reports a matching `media_content_id` while playing.
- If the speaker needs repeat or shuffle, create a Home Assistant script that sets those options and starts playback, then trigger that script from an EspControl Action card.

::: info Requires Home Assistant actions
Media cards send Home Assistant actions from the panel. If tapping a card does nothing, check [Enable Actions](/getting-started/home-assistant-actions).
:::
