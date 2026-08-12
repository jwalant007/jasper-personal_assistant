using System;
using System.Threading;
using Windows.Foundation;
using Windows.Media.Control;

namespace JasperMedia
{
    public class NowPlayingFetcher
    {
        public static void Main(string[] args)
        {
            Console.WriteLine(GetNowPlayingJson());
        }

        public static T AwaitOp<T>(IAsyncOperation<T> asyncOp)
        {
            if (asyncOp == null) return default(T);
            while (asyncOp.Status == AsyncStatus.Started)
            {
                Thread.Sleep(10);
            }
            if (asyncOp.Status == AsyncStatus.Completed)
            {
                return asyncOp.GetResults();
            }
            return default(T);
        }

        public static string GetNowPlayingJson()
        {
            try
            {
                var asyncMgr = GlobalSystemMediaTransportControlsSessionManager.RequestAsync();
                var manager = AwaitOp(asyncMgr);

                GlobalSystemMediaTransportControlsSession session = null;
                if (manager != null)
                {
                    session = manager.GetCurrentSession();
                    if (session == null)
                    {
                        var sessions = manager.GetSessions();
                        if (sessions != null && sessions.Count > 0)
                        {
                            foreach (var s in sessions)
                            {
                                var info = s.GetPlaybackInfo();
                                if (info != null && info.PlaybackStatus == GlobalSystemMediaTransportControlsSessionPlaybackStatus.Playing)
                                {
                                    session = s;
                                    break;
                                }
                            }
                            if (session == null) session = sessions[0];
                        }
                    }
                }

                if (session == null)
                {
                    return "{\"success\":true, \"isPlaying\":false, \"title\":\"\", \"artist\":\"\"}";
                }

                var asyncProps = session.TryGetMediaPropertiesAsync();
                var props = AwaitOp(asyncProps);
                var pb = session.GetPlaybackInfo();
                var timeline = session.GetTimelineProperties();

                bool playing = pb != null && pb.PlaybackStatus == GlobalSystemMediaTransportControlsSessionPlaybackStatus.Playing;
                string status = pb != null ? pb.PlaybackStatus.ToString() : "Unknown";
                string app = session.SourceAppUserModelId != null ? session.SourceAppUserModelId : "";
                
                string title = (props != null && props.Title != null) ? props.Title : "";
                string artist = (props != null && props.Artist != null) ? props.Artist : "";
                string album = (props != null && props.AlbumTitle != null) ? props.AlbumTitle : "";

                double dur = timeline != null ? timeline.EndTime.TotalMilliseconds : 0;
                double pos = timeline != null ? timeline.Position.TotalMilliseconds : 0;

                // Escape quotes and backslashes for JSON output
                title = title.Replace("\\", "\\\\").Replace("\"", "\\\"").Replace("\n", " ").Replace("\r", "");
                artist = artist.Replace("\\", "\\\\").Replace("\"", "\\\"").Replace("\n", " ").Replace("\r", "");
                album = album.Replace("\\", "\\\\").Replace("\"", "\\\"").Replace("\n", " ").Replace("\r", "");
                app = app.Replace("\\", "\\\\").Replace("\"", "\\\"").Replace("\n", " ").Replace("\r", "");

                return string.Format(
                    "{{\"success\":true,\"isPlaying\":{0},\"status\":\"{1}\",\"app\":\"{2}\",\"title\":\"{3}\",\"artist\":\"{4}\",\"album\":\"{5}\",\"durationMs\":{6},\"positionMs\":{7}}}",
                    playing.ToString().ToLower(), status, app, title, artist, album, dur, pos
                );
            }
            catch (Exception ex)
            {
                string errMsg = ex.Message.Replace("\\", "\\\\").Replace("\"", "\\\"").Replace("\n", " ").Replace("\r", "");
                return "{\"success\":false,\"error\":\"" + errMsg + "\"}";
            }
        }
    }
}
