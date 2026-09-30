using System.Threading.Channels;

namespace VeggieBook.Api.Email;

// Controllers drop emails here and return right away. EmailWorker sends
// them in the background. The queue holds up to 500; the rate limits keep
// it far below that in practice.
public class EmailQueue(ILogger<EmailQueue> log)
{
    private readonly Channel<EmailMessage> channel =
        Channel.CreateBounded<EmailMessage>(new BoundedChannelOptions(500)
        {
            FullMode = BoundedChannelFullMode.DropWrite
        });

    public ChannelReader<EmailMessage> Reader => channel.Reader;

    public void Enqueue(EmailMessage message)
    {
        if (!channel.Writer.TryWrite(message))
            log.LogError("Email queue is full. Dropped an email: {Subject}", message.Subject);
    }
}